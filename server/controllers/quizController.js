const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

// Helper to sanitize quiz questions for students
const sanitizeQuizForStudent = (quizDoc) => {
  const quizObj = quizDoc.toObject ? quizDoc.toObject() : { ...quizDoc };
  if (quizObj.questions && Array.isArray(quizObj.questions)) {
    quizObj.questions = quizObj.questions.map(q => {
      if (typeof q === 'object' && q !== null) {
        if (q.options && Array.isArray(q.options)) {
          q.options = q.options.map(opt => ({
            _id: opt._id,
            text: opt.text
          }));
        }
        delete q.explanation;
      }
      return q;
    });
  }
  return quizObj;
};

// Create a new quiz
// POST /api/v1/quizzes
const createQuiz = async (req, res, next) => {
  try {
    const {
      title,
      description,
      domain,
      topic,
      difficulty,
      questions,
      timeLimit,
      passingScore,
      isAdaptive,
      status
    } = req.body;

    let totalMarks = 0;
    const questionIdList = Array.isArray(questions) ? questions : [];

    if (questionIdList.length > 0) {
      const foundQuestions = await Question.find({ _id: { $in: questionIdList } });
      if (foundQuestions.length !== questionIdList.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more question IDs do not exist in the database'
        });
      }
      totalMarks = foundQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    }

    const quizStatus = status || 'draft';
    if (quizStatus === 'published' && questionIdList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish a quiz with no questions'
      });
    }

    const quiz = await Quiz.create({
      title,
      description: description || '',
      domain: domain || 'General',
      topic,
      difficulty: difficulty || 'intermediate',
      questions: questionIdList,
      totalMarks,
      timeLimit: timeLimit !== undefined ? Number(timeLimit) : 30,
      passingScore: passingScore !== undefined ? Number(passingScore) : 60,
      isAdaptive: Boolean(isAdaptive),
      status: quizStatus,
      createdBy: req.user.userId
    });

    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate('questions')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      data: populatedQuiz
    });
  } catch (error) {
    next(error);
  }
};

// Get quizzes list
// GET /api/v1/quizzes
const getQuizzes = async (req, res, next) => {
  try {
    const { topic, domain, difficulty, status, search, mine } = req.query;
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      // Students can ONLY view published quizzes
      filter.status = 'published';
    } else {
      // Teachers and interviewers
      if (mine === 'true') {
        filter.createdBy = req.user.userId;
      }
      if (status) {
        filter.status = status;
      }
    }

    if (topic) {
      filter.topic = { $regex: topic, $options: 'i' };
    }

    if (domain) {
      filter.domain = { $regex: domain, $options: 'i' };
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const quizzes = await Quiz.find(filter)
      .populate('questions')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    const resultData = req.user.role === 'student'
      ? quizzes.map(q => sanitizeQuizForStudent(q))
      : quizzes;

    res.status(200).json({
      success: true,
      count: resultData.length,
      data: resultData
    });
  } catch (error) {
    next(error);
  }
};

// Get single quiz by ID
// GET /api/v1/quizzes/:id
const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('questions')
      .populate('createdBy', 'name email role');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Role and publication status access control
    if (quiz.status !== 'published') {
      if (req.user.role === 'student') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This quiz is not published'
        });
      }

      // If unpublished and user is not creator
      if (quiz.createdBy._id.toString() !== req.user.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this unpublished quiz'
        });
      }
    }

    const responseData = req.user.role === 'student'
      ? sanitizeQuizForStudent(quiz)
      : quiz;

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

// Update quiz
// PUT /api/v1/quizzes/:id
const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Ownership check
    if (quiz.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this quiz'
      });
    }

    const {
      title,
      description,
      domain,
      topic,
      difficulty,
      questions,
      timeLimit,
      passingScore,
      isAdaptive,
      status
    } = req.body;

    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (domain !== undefined) quiz.domain = domain;
    if (topic !== undefined) quiz.topic = topic;
    if (difficulty !== undefined) quiz.difficulty = difficulty;
    if (timeLimit !== undefined) quiz.timeLimit = Number(timeLimit);
    if (passingScore !== undefined) quiz.passingScore = Number(passingScore);
    if (isAdaptive !== undefined) quiz.isAdaptive = Boolean(isAdaptive);

    if (questions !== undefined) {
      if (questions.length > 0) {
        const foundQuestions = await Question.find({ _id: { $in: questions } });
        if (foundQuestions.length !== questions.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more question IDs do not exist in the database'
          });
        }
        quiz.questions = questions;
        quiz.totalMarks = foundQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
      } else {
        quiz.questions = [];
        quiz.totalMarks = 0;
      }
    }

    if (status !== undefined) {
      if (status === 'published' && quiz.questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot publish a quiz with no questions'
        });
      }
      quiz.status = status;
    }

    await quiz.save();

    const updatedQuiz = await Quiz.findById(quiz._id)
      .populate('questions')
      .populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      data: updatedQuiz
    });
  } catch (error) {
    next(error);
  }
};

// Delete quiz
// DELETE /api/v1/quizzes/:id
const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Ownership check
    if (quiz.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this quiz'
      });
    }

    await Quiz.findByIdAndDelete(quiz._id);

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add questions to quiz
// POST /api/v1/quizzes/:id/questions
const addQuestionsToQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (quiz.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this quiz'
      });
    }

    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'questionIds must be a non-empty array'
      });
    }

    const foundQuestions = await Question.find({ _id: { $in: questionIds } });
    if (foundQuestions.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more question IDs do not exist in the database'
      });
    }

    const existingSet = new Set(quiz.questions.map(q => q.toString()));
    for (const qId of questionIds) {
      if (!existingSet.has(qId.toString())) {
        quiz.questions.push(qId);
      }
    }

    // Recalculate total marks
    const allQuestions = await Question.find({ _id: { $in: quiz.questions } });
    quiz.totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    await quiz.save();

    const updatedQuiz = await Quiz.findById(quiz._id)
      .populate('questions')
      .populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      data: updatedQuiz
    });
  } catch (error) {
    next(error);
  }
};

// Remove question from quiz
// DELETE /api/v1/quizzes/:id/questions/:questionId
const removeQuestionFromQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (quiz.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this quiz'
      });
    }

    const questionIdToRemove = req.params.questionId;
    quiz.questions = quiz.questions.filter(qId => qId.toString() !== questionIdToRemove);

    if (quiz.questions.length === 0 && quiz.status === 'published') {
      quiz.status = 'draft';
    }

    const allQuestions = await Question.find({ _id: { $in: quiz.questions } });
    quiz.totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    await quiz.save();

    const updatedQuiz = await Quiz.findById(quiz._id)
      .populate('questions')
      .populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      data: updatedQuiz
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestionsToQuiz,
  removeQuestionFromQuiz
};
