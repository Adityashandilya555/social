import express from 'express';
import { Post } from '../models';

const router = express.Router();

// GET /api/posts - Get all posts
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'name profilePictureUrl')
      .populate('likes', 'name profilePictureUrl')
      .populate('comments.author', 'name profilePictureUrl')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/:id - Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email profilePictureUrl')
      .populate('likes', 'name profilePictureUrl')
      .populate('comments.author', 'name profilePictureUrl')
      .select('-__v');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/posts - Create new post
router.post('/', async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    
    await post.populate('author', 'name profilePictureUrl');

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        ...post.toObject(),
        __v: undefined,
      },
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/posts/:id - Update post
router.put('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('author', 'name profilePictureUrl')
    .populate('likes', 'name profilePictureUrl')
    .populate('comments.author', 'name profilePictureUrl')
    .select('-__v');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: 'Post updated successfully',
      post,
    });
  } catch (error: any) {
    console.error('Error updating post:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// POST /api/posts/:id/like - Like/unlike a post
router.post('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await post.toggleLike(userId);

    res.json({
      message: post.isLikedBy(userId) ? 'Post liked' : 'Post unliked',
      likeCount: post.likes.length,
      isLiked: post.isLikedBy(userId),
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /api/posts/:id/comments - Add comment to post
router.post('/:id/comments', async (req, res) => {
  try {
    const { userId, content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    await post.addComment(userId, content);
    await post.populate('comments.author', 'name profilePictureUrl');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
      commentCount: post.comments.length,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// DELETE /api/posts/:id/comments/:commentId - Delete comment
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await post.removeComment(req.params.commentId);

    res.json({
      message: 'Comment deleted successfully',
      commentCount: post.comments.length,
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// GET /api/posts/user/:userId - Get posts by user
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'name profilePictureUrl')
      .populate('likes', 'name profilePictureUrl')
      .populate('comments.author', 'name profilePictureUrl')
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// GET /api/posts/search/:query - Search posts by content
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const posts = await Post.find({
      content: { $regex: query, $options: 'i' }
    })
    .populate('author', 'name profilePictureUrl')
    .populate('likes', 'name profilePictureUrl')
    .select('-__v')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({ posts });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;