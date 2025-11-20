const { Genre, Book } = require('../models');

exports.getGenres = async (req, res) => {
  try {
    const genres = await Genre.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: genres
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getGenre = async (req, res) => {
  try {
    const genre = await Genre.findByPk(req.params.id);

    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    res.json({
      success: true,
      data: genre
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createGenre = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const normalizedName = name.trim();
    const existingGenre = await Genre.findOne({ where: { name: normalizedName } });

    if (existingGenre) {
      return res.status(400).json({ message: 'Genre already exists' });
    }

    const genre = await Genre.create({ name: normalizedName });

    res.status(201).json({
      success: true,
      data: genre
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateGenre = async (req, res) => {
  try {
    const { name } = req.body;
    const genre = await Genre.findByPk(req.params.id);

    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const normalizedName = name.trim();

    const duplicateGenre = await Genre.findOne({
      where: { name: normalizedName }
    });

    if (duplicateGenre && duplicateGenre.id !== genre.id) {
      return res.status(400).json({ message: 'Genre already exists' });
    }

    await genre.update({ name: normalizedName });

    res.json({
      success: true,
      data: genre
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteGenre = async (req, res) => {
  try {
    const genre = await Genre.findByPk(req.params.id);

    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    const bookCount = await Book.count({ where: { genre_id: genre.id } });

    if (bookCount > 0) {
      return res.status(400).json({ message: 'Cannot delete genre with associated books' });
    }

    await genre.destroy();

    res.json({
      success: true,
      message: 'Genre deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



