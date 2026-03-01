const express = require('express');
const {
  getHeroBanner,
  recordBannerClick,
} = require('../controllers/bannerController');

const router = express.Router();

router.get('/hero', getHeroBanner);
router.post('/:id/click', recordBannerClick);

module.exports = router;

