const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

// Create a new question
// POST /api/v1/questions
const createQuestion = async (req, res, next) => {
  try {
    const {
      content,
      type,
      options,
      domain,
      topic,
      difficulty,
      difficultyLevel,
      marks,
      explanation
    } = req.body;

    let computedDifficulty = difficulty !== undefined ? Number(difficulty) : 1000;
    let computedLevel = difficultyLevel;

    if (!computedLevel) {
      if (computedDifficulty < 800) computedLevel = 'easy';
      else if (computedDifficulty > 1200) computedLevel = 'hard';
      else computedLevel = 'medium';
    }

    const question = await Question.create({
      content,
      type: type || 'multiple_choice',
      options,
      domain: domain || 'General',
      topic,
      difficulty: computedDifficulty,
      difficultyLevel: computedLevel,
      marks: marks !== undefined ? Number(marks) : 1,
      explanation: explanation || '',
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// Get list of questions
// GET /api/v1/questions
const getQuestions = async (req, res, next) => {
  try {
    const { topic, domain, difficultyLevel, search, mine } = req.query;
    const filter = {};

    if (mine === 'true') {
      filter.createdBy = req.user.userId;
    }

    if (topic) {
      filter.topic = { $regex: topic, $options: 'i' };
    }

    if (domain) {
      filter.domain = { $regex: domain, $options: 'i' };
    }

    if (difficultyLevel) {
      filter.difficultyLevel = difficultyLevel;
    }

    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ];
    }

    const questions = await Question.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

// Get single question by ID
// GET /api/v1/questions/:id
const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('createdBy', 'name email role');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Protect answer keys from student view
    if (req.user && req.user.role === 'student') {
      return res.status(200).json({
        success: true,
        data: question.toStudentSafeObject()
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing question
// PUT /api/v1/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Ownership check: only creator can modify
    if (question.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this question'
      });
    }

    const {
      content,
      type,
      options,
      domain,
      topic,
      difficulty,
      difficultyLevel,
      marks,
      explanation
    } = req.body;

    if (content !== undefined) question.content = content;
    if (type !== undefined) question.type = type;
    if (options !== undefined) question.options = options;
    if (domain !== undefined) question.domain = domain;
    if (topic !== undefined) question.topic = topic;
    if (explanation !== undefined) question.explanation = explanation;

    if (difficulty !== undefined) {
      question.difficulty = Number(difficulty);
      if (!difficultyLevel) {
        if (question.difficulty < 800) question.difficultyLevel = 'easy';
        else if (question.difficulty > 1200) question.difficultyLevel = 'hard';
        else question.difficultyLevel = 'medium';
      }
    }

    if (difficultyLevel !== undefined) {
      question.difficultyLevel = difficultyLevel;
    }

    const marksChanged = marks !== undefined && Number(marks) !== question.marks;
    if (marks !== undefined) {
      question.marks = Number(marks);
    }

    await question.save();

    // If marks changed, update totalMarks of all quizzes referencing this question
    if (marksChanged) {
      const affectedQuizzes = await Quiz.find({ questions: question._id }).populate('questions', 'marks');
      for (const quiz of affectedQuizzes) {
        quiz.totalMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
        await quiz.save();
      }
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// Delete a question
// DELETE /api/v1/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Ownership check: only creator can delete
    if (question.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this question'
      });
    }

    // Remove reference from all quizzes that include this question
    const affectedQuizzes = await Quiz.find({ questions: question._id });
    for (const quiz of affectedQuizzes) {
      quiz.questions = quiz.questions.filter(
        qId => qId.toString() !== question._id.toString()
      );
      // If quiz was published and now has 0 questions, demote to draft
      if (quiz.questions.length === 0 && quiz.status === 'published') {
        quiz.status = 'draft';
      }
      await quiz.populate('questions', 'marks');
      quiz.totalMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      await quiz.save();
    }

    await Question.findByIdAndDelete(question._id);

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
};
