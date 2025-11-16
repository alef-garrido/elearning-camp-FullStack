const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/users');
const { uploadUserPhoto } = require('../controllers/userPhoto');
const User = require('../models/User');

//middlewares
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const { uploadSingle } = require('../middleware/upload');
const { deleteUserPhoto } = require('../controllers/userPhoto');

const router = express.Router();


// Route for uploading user profile photo (authenticated user only)
router.post('/photo', protect, uploadSingle('file'), uploadUserPhoto);
// Route for deleting authenticated user's profile photo
router.delete('/photo', protect, deleteUserPhoto);

router.use(protect);
router.use(authorize('admin'));


router
  .route('/')
    .get(advancedResults(User), getUsers)
    .post(createUser);

router
  .route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;