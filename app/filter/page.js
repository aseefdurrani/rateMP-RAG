"use client";
// import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";

export default function Filter() {
  const router = useRouter();

  const handleHome = () => {
    router.push("/");
  };

  const handleSearch = () => {
    router.push("/professorChat");
  };

  const ratings = [
    "1 star or above",
    "2 stars or above",
    "3 stars or above",
    "4 stars or above",
    "5 stars",
  ];
  const difficulty = ["Easy", "Medium", "Hard"];
  const workload = ["Light", "Medium", "Heavy"];
  const subjects = [
    "Artificial Intelligence",
    "Biochemistry",
    "Calculus I",
    "Calculus II",
    "Classical Literature",
    "Cognitive Psychology",
    "Comparative Politics",
    "Computer Networks",
    "Cultural Anthropology",
    "Database Systems",
    "Developmental Psychology",
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
    "Linear Algebra",
    "Machine Learning",
    "Microeconomics",
    "Molecular Biology",
    "Organic Chemistry",
    "Philosophy of Mind",
    "Philosophy of Religion",
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

  const [returnedProfessors, setReturnedProfessors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterSubmit = () => {
    setSelectedFilters([
      selectedRating,
      selectedDifficulty,
      selectedWorkload,
      selectedSubject,
    ]);
    // console.log("Selected filters:", selectedFilters);
  };

  // ... existing code ...
  const handleClick = () => {
    setIsLoading(true);
    handleFilterSubmit();
    setReturnedProfessors([]);
    setSelectedRating(""); // Reset the rating dropdown
    setSelectedDifficulty(""); // Reset the difficulty dropdown
    setSelectedWorkload(""); // Reset the workload dropdown
    setSelectedSubject(""); // Reset the subject dropdown
  };

  useEffect(() => {
    if (selectedFilters.length > 0) {
      sendFiltersToEndpoint(selectedFilters);
    }
  }, [selectedFilters]);

  const sendFiltersToEndpoint = (filters) => {
    console.log("Sending filters to endpoint:", filters);

    let filter = "I want professors";

    for (let i = 0; i < filters.length; i++) {
      if (filters[i] !== "") {
        if (i === 0) {
          filter += ` that are rated ${filters[i]}`;
        } else if (i === 1) {
          filter += ` with a difficulty level ${filters[i]}`;
        } else if (i === 2) {
          filter += ` that have a workload ${filters[i]}`;
        } else if (i === 3) {
          filter += ` who teach ${filters[i]}`;
        }
      }
    }

    // const filter = `I want professors that are rated ${filters[0]}, with a diffuculty level ${filters[1]}, that have a workload ${filters[2]}, and who teach ${filters[3]}.`;

    console.log("Filter:", filter);
    const response = fetch("/api/filterSearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "user", content: filter }),
    })
      .then(async (res) => res.json())
      .then((data) => {
        // returnedProfessorsList = data;
        setReturnedProfessors(data);
        console.log("Returned Professors:", data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log("Error fetching data:", err);
        setIsLoading(false);
      });
  };

  return (
    <div className="bg-customBg min-h-screen flex flex-col ">
      <div className="navbar bg-customPrimary text-white">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">ProfInsight</a>
        </div>
        <div className="flex-none gap-4">
          <button className="btn btn-ghost border-white" onClick={handleSearch}>
            Search Professors
          </button>
          <button className="btn btn-ghost border-white" onClick={handleHome}>
            Go Home
          </button>
        </div>
      </div>
      <div className="flex flex-row justify-around items-center mt-10">
        <select
          className="select w-full max-w-xs bg-white text-black border-customPrimary"
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
        >
          <option disabled value="">
            Select Rating
          </option>
          {ratings.map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
        <select
          className="select w-full max-w-xs bg-white text-black border-customPrimary"
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
        >
          <option disabled value="">
            Select Difficulty Level
          </option>
          {difficulty.map((diff) => (
            <option key={diff} value={diff}>
              {diff}
            </option>
          ))}
        </select>
        <select
          className="select w-full max-w-xs bg-white text-black border-customPrimary"
          value={selectedWorkload}
          onChange={(e) => setSelectedWorkload(e.target.value)}
        >
          <option disabled value="">
            Select Workload
          </option>
          {workload.map((wrkld) => (
            <option key={wrkld} value={wrkld}>
              {wrkld}
            </option>
          ))}
        </select>
        <select
          className="select w-full max-w-xs bg-white text-black border-customPrimary"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option disabled value="">
            Select Subject
          </option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <button
          className="btn btn-outline text-customPrimary border-customPrimary hover:bg-customPrimary hover:text-customPrimaryLight"
          onClick={handleClick}
          disabled={
            !selectedRating &&
            !selectedDifficulty &&
            !selectedWorkload &&
            !selectedSubject
          }
        >
          Submit
        </button>
      </div>
      <h3 className="text-center text-2xl mt-10 text-customPrimary">
        Top Results:
      </h3>
      <div className="flex flex-wrap justify-center items-center mt-4">
        {returnedProfessors.length === 0 && isLoading === true ? (
          <span className="loading loading-dots loading-lg text-customPrimary"></span>
        ) : (
          returnedProfessors.map((professor) => (
            <div
              key={professor.id}
              className="card bg-base-100 w-[600px] m-5 shadow-xl bg-white text-black"
            >
              <div className="card-body">
                <h2 className="card-title">{professor.name}</h2>
                <p>
                  <i>Subject:</i> {professor.subject}
                </p>
                <p>
                  <i>Rating:</i> {professor.rating}
                </p>
                <p>
                  <i>Review:</i> {professor.review}
                </p>
                <p>
                  <i>Other Info:</i> {professor.crucialInfo}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
