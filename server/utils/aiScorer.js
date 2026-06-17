import Groq from 'groq-sdk';

// Lazy singleton
let _groq = null;
const getClient = () => {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in your .env file');
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
};

// Send a prompt and get text back
const ask = async (prompt) => {
  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 4096,
  });
  return response.choices[0].message.content.trim();
};

// Strip markdown code fences Groq sometimes adds
const cleanJSON = (text) =>
  text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

/**
 * Scores a CV against a job using Groq (Llama 3).
 * Returns a score out of 50.
 */
export const scoreCV = async (cvText, job) => {
  if (process.env.DEMO_MODE === 'true') {
    const score = Math.floor(Math.random() * 21) + 30; // 30–50
    return {
      score,
      feedback: `[Demo] This CV scored ${score}/50. Skills appear relevant to the ${job.title} role.`,
    };
  }

  const prompt = `You are a senior HR specialist at Ethiopian Airlines.
Evaluate this CV for the job below and return ONLY valid JSON — no markdown, no explanation outside the JSON.

JOB TITLE: ${job.title}
DEPARTMENT: ${job.department}
REQUIREMENTS: ${job.requirements.join(', ')}
KEYWORDS: ${job.keywords.join(', ')}

CV:
${cvText.substring(0, 3000)}

Return exactly this JSON format:
{"score": <integer 0-50>, "feedback": "<2-3 sentence explanation>"}`;

  try {
    const text = await ask(prompt);
    const parsed = JSON.parse(cleanJSON(text));
    return {
      score: Math.min(50, Math.max(0, Math.round(Number(parsed.score)))),
      feedback: parsed.feedback || '',
    };
  } catch (err) {
    console.error('Groq CV scoring error:', err.message);
    return { score: 25, feedback: 'AI scoring unavailable. Manual review required.' };
  }
};

/**
 * Generates 10 MCQ exam questions using Groq (Llama 3).
 * Each correct answer = 5 points → total 50.
 */
export const generateExamQuestions = async (job) => {
  if (process.env.DEMO_MODE === 'true') {
    return [
      { question: `What is the primary responsibility of a ${job.title}?`, options: ['A. Managing budgets', 'B. Performing core job duties effectively', 'C. Recruiting new staff', 'D. Handling customer complaints'], correctAnswer: 'B. Performing core job duties effectively', type: 'mcq' },
      { question: 'How do you prioritize tasks when facing multiple deadlines?', options: ['A. Work on the easiest task first', 'B. Assess urgency and impact, then prioritize accordingly', 'C. Ask a colleague to decide', 'D. Work on tasks randomly'], correctAnswer: 'B. Assess urgency and impact, then prioritize accordingly', type: 'mcq' },
      { question: 'What does effective teamwork require?', options: ['A. Doing all the work yourself', 'B. Collaborating and communicating toward shared goals', 'C. Avoiding conflict at all costs', 'D. Following orders without question'], correctAnswer: 'B. Collaborating and communicating toward shared goals', type: 'mcq' },
      { question: 'Ethiopian Airlines is headquartered in which city?', options: ['A. Nairobi', 'B. Cairo', 'C. Addis Ababa', 'D. Lagos'], correctAnswer: 'C. Addis Ababa', type: 'mcq' },
      { question: 'What is the best approach when you make a mistake at work?', options: ['A. Hide it', 'B. Blame a colleague', 'C. Acknowledge it, report it, and fix it', 'D. Resign'], correctAnswer: 'C. Acknowledge it, report it, and fix it', type: 'mcq' },
      { question: 'What does KPI stand for?', options: ['A. Key Performance Indicator', 'B. Known Process Integration', 'C. Key Project Initiative', 'D. Knowledge Process Interface'], correctAnswer: 'A. Key Performance Indicator', type: 'mcq' },
      { question: 'Which skill is most critical for effective workplace communication?', options: ['A. Speaking loudly', 'B. Active listening and clarity', 'C. Using technical jargon', 'D. Interrupting to make points'], correctAnswer: 'B. Active listening and clarity', type: 'mcq' },
      { question: 'How should confidential company information be handled?', options: ['A. Share with friends', 'B. Post on social media', 'C. Keep strictly confidential per policy', 'D. Discuss openly'], correctAnswer: 'C. Keep strictly confidential per policy', type: 'mcq' },
      { question: 'What is the main purpose of a performance review?', options: ['A. Punish underperformers', 'B. Evaluate progress and set improvement goals', 'C. Decide who gets fired', 'D. Fill out paperwork'], correctAnswer: 'B. Evaluate progress and set improvement goals', type: 'mcq' },
      { question: 'What does professionalism primarily involve?', options: ['A. Wearing expensive clothes', 'B. Arriving late but working hard', 'C. Consistent reliability, respect, and quality work', 'D. Socializing with management'], correctAnswer: 'C. Consistent reliability, respect, and quality work', type: 'mcq' },
    ];
  }

  const prompt = `You are creating a pre-employment exam for Ethiopian Airlines.

JOB TITLE: ${job.title}
DEPARTMENT: ${job.department}
REQUIREMENTS: ${job.requirements.join(', ')}

Generate exactly 10 multiple-choice questions testing technical knowledge, situational judgment, and role-specific skills.
Return ONLY a valid JSON array — no markdown, no extra text:
[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":"A. ...","type":"mcq"}]`;

  try {
    const text = await ask(prompt);
    const questions = JSON.parse(cleanJSON(text));
    return Array.isArray(questions) ? questions.slice(0, 10) : [];
  } catch (err) {
    console.error('Groq exam generation error:', err.message);
    return [];
  }
};
