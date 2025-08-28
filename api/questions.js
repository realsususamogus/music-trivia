// Vercel serverless function for getting questions
const questions = [
  {
    id: 1,
    question: "Which artist released the album 'Thriller'?",
    options: ["Michael Jackson", "Prince", "Madonna", "Whitney Houston"],
    correct: 0,
    type: "artist"
  },
  {
    id: 2,
    question: "What year was 'Bohemian Rhapsody' by Queen released?",
    options: ["1974", "1975", "1976", "1977"],
    correct: 1,
    type: "year"
  },
  {
    id: 3,
    question: "Which song contains the lyrics 'Is this the real life? Is this just fantasy?'",
    options: ["We Will Rock You", "Another One Bites the Dust", "Bohemian Rhapsody", "We Are the Champions"],
    correct: 2,
    type: "lyrics"
  },
  {
    id: 4,
    question: "Which band performed 'Stairway to Heaven'?",
    options: ["The Beatles", "Led Zeppelin", "Pink Floyd", "The Rolling Stones"],
    correct: 1,
    type: "artist"
  },
  {
    id: 5,
    question: "What genre is most associated with Bob Marley?",
    options: ["Jazz", "Blues", "Reggae", "Rock"],
    correct: 2,
    type: "genre"
  },
  {
    id: 6,
    question: "Which album features the song 'Hotel California'?",
    options: ["The Long Run", "Hotel California", "One of These Nights", "Eagles Greatest Hits"],
    correct: 1,
    type: "album"
  },
  {
    id: 7,
    question: "Complete the lyric: 'Hello, is it me you're looking ___?'",
    options: ["at", "for", "after", "around"],
    correct: 1,
    type: "lyrics"
  },
  {
    id: 8,
    question: "Which artist is known as the 'King of Pop'?",
    options: ["Elvis Presley", "Michael Jackson", "Prince", "David Bowie"],
    correct: 1,
    type: "artist"
  },
  {
    id: 9,
    question: "What instrument is Jimi Hendrix most famous for playing?",
    options: ["Piano", "Drums", "Bass", "Guitar"],
    correct: 3,
    type: "instrument"
  },
  {
    id: 10,
    question: "Which city is often called the birthplace of jazz?",
    options: ["Chicago", "New York", "New Orleans", "Memphis"],
    correct: 2,
    type: "history"
  }
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    const shuffledQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, 5);
    res.status(200).json(shuffledQuestions);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}