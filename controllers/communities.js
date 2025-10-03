const Community = require('../models/Community');

// @desc      Get all communities
// @route     GET /api/v1/communities
// @access    Public
exports.getCommunities = async (req, res, next) => {
  try {
    const communities = await Community.find();
    res.status(200).json({ success: true, count: communities.length ,data: communities });
  
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });

  }
}


// @desc      Get single community
// @route     GET /api/v1/communities/:id
// @access    Public
exports.getCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ success: false, error: 'No community found' });
    }
    res.status(200).json({ success: true, data: community });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
    
  }
}


// @desc      Create new community
// @route     POST /api/v1/communities
// @access    Private
exports.createCommunity = async (req, res, next) => {
  try {
    const community = await Community.create(req.body);
  
    res.status(201).json({
      success: true,
      data: community
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// @desc      Update community
// @route     PUT /api/v1/communities/:id
// @access    Private
exports.updateCommunity = async (req, res, next) => {
  try {
    const community = await Community.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
  
    if (!community) {
      return res.status(404).json({ success: false, error: 'No community found' });
    }
    res.status(200).json({ success: true, data: community });
    
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }

}


// @desc      Delete community
// @route     DELETE /api/v1/communities/:id
// @access    Private
exports.deleteCommunity = async (req, res, next) => {
  try {
    const community = await Community.findByIdAndDelete(req.params.id);

    if (!community) {
      return res.status(404).json({ success: false, error: 'No community found' });
    }
    res.status(200).json({ success: true, data: {} });
    
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
 
}

