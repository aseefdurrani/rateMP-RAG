"use client";
// import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

export default function Filter() {
  const router = useRouter();

  const handleHome = () => {
    router.push("/");
  };

  const ratings = [
    "Select Rating",
    "1 star or above",
    "2 stars or above",
    "3 stars or above",
    "4 stars or above",
    "5 stars",
  ];
  const difficulty = ["Select Difficulty Level", "Easy", "Medium", "Hard"];
  const workload = ["Select Workload", "Light", "Medium", "Heavy"];
  const subjects = [
    "Select Subject",
    "Advanced Calculus",
    "Advanced Genetics",
    "Advanced Organic Chemistry",
    "Advanced Statistics",
    "Art History",
    "Artificial Intelligence",
    "Behavioral Economics",
    "Biochemistry",
    "Calculus I",
    "Calculus II",
    "Classical Literature",
    "Clinical Psychology",
    "Cognitive Psychology",
    "Comparative Politics",
    "Computer Networks",
    "Cultural Anthropology",
    "Cultural Studies",
    "Database Systems",
    "Developmental Psychology",
    "Digital Signal Processing",
    "Discrete Mathematics",
    "Ecology",
    "Environmental Engineering",
    "Environmental Policy",
    "Environmental Science",
    "Ethical Philosophy",
    "Ethics in Science",
    "Genetics",
    "History of the Middle East",
    "Human Resource Management",
    "International Relations",
    "Introduction to Computer Science",
    "Introduction to Electrical Engineering",
    "Introduction to Philosophy",
    "Introduction to Physics",
    "Introduction to Psychology",
    "Introduction to Robotics",
    "Introduction to Sociology",
    "Italian Language and Culture",
    "Linear Algebra",
    "Machine Learning",
    "Machine Learning Applications",
    "Microeconomics",
    "Modern European History",
    "Molecular Biology",
    "Neuroscience",
    "Numerical Methods",
    "Organic Chemistry",
    "Philosophy of Mind",
    "Philosophy of Religion",
    "Political Economy",
    "Political Theory",
    "Principles of Economics",
    "Principles of Management",
    "Principles of Marketing",
    "Quantum Mechanics",
    "Quantum Physics",
    "Software Engineering",
    "Statistics",
    "Thermodynamics",
    "World History",
  ];

  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedWorkload, setSelectedWorkload] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const handleFilterSubmit = () => {
    setSelectedFilters([
      selectedRating,
      selectedDifficulty,
      selectedWorkload,
      selectedSubject,
    ]);
    console.log(selectedFilters);
  };

  return (
    <div className="bg-customBg min-h-screen flex flex-col ">
      <div className="navbar bg-customPrimary text-white">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">ProfInsight</a>
        </div>
        <div className="flex-none">
          <button className="btn btn-ghost" onClick={handleHome}>
            Go Home
          </button>
        </div>
      </div>
      <div className="flex flex-row justify-around items-center mt-10">
        <select
          className="select select-primary w-full max-w-xs"
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
        >
          <option disabled selected>
            Select Rating
          </option>
          {ratings.map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
        <select
          className="select select-primary w-full max-w-xs"
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
        >
          <option disabled selected>
            Select Difficulty Level
          </option>
          {difficulty.map((diff) => (
            <option key={diff} value={diff}>
              {diff}
            </option>
          ))}
        </select>
        <select
          className="select select-primary w-full max-w-xs"
          value={selectedWorkload}
          onChange={(e) => setSelectedWorkload(e.target.value)}
        >
          <option disabled selected>
            Select Workload
          </option>
          {workload.map((wrkld) => (
            <option key={wrkld} value={wrkld}>
              {wrkld}
            </option>
          ))}
        </select>
        <select
          className="select select-primary w-full max-w-xs"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option disabled selected>
            Select Subject
          </option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <button
          className="btn btn-outline btn-primary"
          onClick={handleFilterSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
