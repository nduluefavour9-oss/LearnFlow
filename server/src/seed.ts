import "./env";
import { pool } from "./db";
import { courseStudyGuides } from "./course-study-guides";
import type { CourseDetails } from "./types";

const courses = [
  {
    slug: "harvard-cs50x-2026",
    title: "CS50x: Introduction to Computer Science",
    summary: "A broad introduction to computer science and programming from Harvard University. Follow the official course for lectures, assignments, and the complete syllabus.",
    subject: "Computer Science",
    level: "beginner",
    provider: "Harvard University",
    sourceUrl: "https://cs50.harvard.edu/x/2026/",
    licenseName: "CC BY-NC-SA 4.0",
    licenseUrl: "https://cs50.harvard.edu/x/2026/license/",
    attribution: "Harvard University, CS50x 2026. Review the course license and each asset's terms before reuse.",
  },
  {
    slug: "stanford-cs106a",
    title: "CS106A: Programming Methodology",
    summary: "Archived introductory programming materials from Stanford Engineering Everywhere. The collection is reusable under CC BY-NC-SA unless otherwise noted; exclusions apply.",
    subject: "Computer Science",
    level: "beginner",
    provider: "Stanford University",
    sourceUrl: "https://see.stanford.edu/Course/CS106A",
    licenseName: "CC BY-NC-SA 4.0 (unless noted)",
    licenseUrl: "https://see.stanford.edu/UsingSEE",
    attribution: "Stanford Engineering Everywhere, CS106A. Verify each resource and the SEE reuse FAQ before reuse.",
  },
  {
    slug: "stanford-cs106b",
    title: "CS106B: Programming Abstractions",
    summary: "Archived Stanford materials on programming abstractions, data structures, recursion, and algorithms. The collection is reusable under CC BY-NC-SA unless otherwise noted; exclusions apply.",
    subject: "Computer Science",
    level: "intermediate",
    provider: "Stanford University",
    sourceUrl: "https://see.stanford.edu/Course/CS106B",
    licenseName: "CC BY-NC-SA 4.0 (unless noted)",
    licenseUrl: "https://see.stanford.edu/UsingSEE",
    attribution: "Stanford Engineering Everywhere, CS106B. Verify each resource and the SEE reuse FAQ before reuse.",
  },
  {
    slug: "mit-6-006-algorithms",
    title: "6.006: Introduction to Algorithms",
    summary: "MIT's undergraduate introduction to algorithms, data structures, and problem-solving techniques. Open the official course for its syllabus and learning materials.",
    subject: "Algorithms",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.006 Introduction to Algorithms. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-046j-algorithms",
    title: "6.046J: Design and Analysis of Algorithms",
    summary: "An advanced study of algorithm design and analysis, including graph algorithms, dynamic programming, and complexity.",
    subject: "Algorithms",
    level: "advanced",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.046J Design and Analysis of Algorithms. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-042j-math-computer-science",
    title: "6.042J: Mathematics for Computer Science",
    summary: "Discrete mathematics foundations for computer science, including proofs, graphs, counting, and probability.",
    subject: "Computer Science",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.042J Mathematics for Computer Science. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-005-software-construction",
    title: "6.005: Software Construction",
    summary: "Principles and practices for creating software that is safe from bugs, easy to understand, and ready for change.",
    subject: "Software Engineering",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-005-software-construction-spring-2016/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.005 Software Construction. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-004-computation-structures",
    title: "6.004: Computation Structures",
    summary: "Explore digital systems, computer architecture, instruction sets, pipelining, and the links between hardware and software.",
    subject: "Computer Engineering",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.004 Computation Structures. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-041sc-probability",
    title: "6.041SC: Probabilistic Systems Analysis",
    summary: "Study probability models and statistical inference for analyzing uncertainty in science, engineering, and data.",
    subject: "Probability and Statistics",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.041SC Probabilistic Systems Analysis and Applied Probability. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-02-digital-communication",
    title: "6.02: Digital Communication Systems",
    summary: "An introduction to digital communication systems, including encoding, signals, and networked communication.",
    subject: "Electrical Engineering",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.02 Introduction to EECS II: Digital Communication Systems. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-087-c-programming",
    title: "6.087: Practical Programming in C",
    summary: "A practical introduction to C, covering programming fundamentals, memory, concurrency, and Unix tools.",
    subject: "Programming",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-087-practical-programming-in-c-january-iap-2010/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.087 Practical Programming in C. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-189-python",
    title: "6.189: A Gentle Introduction to Programming Using Python",
    summary: "A beginner-friendly introduction to programming concepts using Python.",
    subject: "Programming",
    level: "beginner",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-189-a-gentle-introduction-to-programming-using-python-january-iap-2011/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.189 A Gentle Introduction to Programming Using Python. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-18-06sc-linear-algebra",
    title: "18.06SC: Linear Algebra",
    summary: "A comprehensive introduction to matrices, vector spaces, linear transformations, and eigenvalues.",
    subject: "Mathematics",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 18.06SC Linear Algebra. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-002-circuits-electronics",
    title: "6.002: Circuits and Electronics",
    summary: "Learn foundational circuit concepts, analog and digital electronics, and the behavior of electrical systems.",
    subject: "Electrical Engineering",
    level: "beginner",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.002 Circuits and Electronics. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-003-signals-systems",
    title: "6.003: Signals and Systems",
    summary: "Study continuous and discrete signals, Fourier representations, linear systems, transforms, and applications.",
    subject: "Electrical Engineering",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.003 Signals and Systems. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-011-communication-control-signal-processing",
    title: "6.011: Communication, Control, and Signal Processing",
    summary: "Explore mathematical foundations and methods used in communication, feedback control, and signal processing.",
    subject: "Electrical Engineering",
    level: "advanced",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.011 Introduction to Communication, Control, and Signal Processing. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-034-artificial-intelligence",
    title: "6.034: Artificial Intelligence",
    summary: "An introduction to core artificial intelligence ideas, representations, and problem-solving approaches.",
    subject: "Artificial Intelligence",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.034 Artificial Intelligence. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-045j-automata-computability",
    title: "6.045J: Automata, Computability, and Complexity",
    summary: "Study theoretical computer science through automata, Turing machines, computational complexity, and randomness.",
    subject: "Computer Science",
    level: "advanced",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.045J Automata, Computability, and Complexity. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-828-operating-system-engineering",
    title: "6.828: Operating System Engineering",
    summary: "Examine operating system design and implementation, including virtual memory, kernels, processes, and system calls.",
    subject: "Computer Systems",
    level: "advanced",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-828-operating-system-engineering-fall-2012/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.828 Operating System Engineering. Check each linked resource for its specific license and attribution.",
  },
  {
    slug: "mit-6-170-software-engineering",
    title: "6.170: Laboratory in Software Engineering",
    summary: "Explore abstractions, modularity, specification, object modeling, design patterns, and testing in larger software systems.",
    subject: "Software Engineering",
    level: "intermediate",
    provider: "MIT OpenCourseWare",
    sourceUrl: "https://ocw.mit.edu/courses/6-170-laboratory-in-software-engineering-fall-2005/",
    licenseName: "CC BY-NC-SA 4.0 (verify per resource)",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    attribution: "MIT OpenCourseWare, 6.170 Laboratory in Software Engineering. Check each linked resource for its specific license and attribution.",
  },
];

const legacyUniversityCourses = [
  {
    slug: "legacy-computer-performance-evaluation",
    title: "Computer Performance Evaluation",
    level: "advanced",
  },
  {
    slug: "legacy-artificial-intelligence",
    title: "Artificial Intelligence",
    level: "intermediate",
  },
  {
    slug: "legacy-remote-sensing-gis",
    title: "Remote Sensing and GIS",
    level: "intermediate",
  },
  {
    slug: "legacy-information-systems-management",
    title: "Information Systems Management",
    level: "beginner",
  },
  {
    slug: "legacy-data-communication-networks",
    title: "Data Communication and Networks",
    level: "intermediate",
  },
  {
    slug: "legacy-net-centric-computing",
    title: "Net-Centric Computing",
    level: "advanced",
  },
  {
    slug: "legacy-project-management",
    title: "Project Management",
    level: "beginner",
  },
  {
    slug: "legacy-organization-programming-languages",
    title: "Organization of Programming Languages",
    level: "advanced",
  },
  {
    slug: "legacy-software-engineering",
    title: "Software Engineering",
    level: "intermediate",
  },
  {
    slug: "legacy-computer-graphics-visualization",
    title: "Computer Graphics and Visualization",
    level: "intermediate",
  },
  {
    slug: "legacy-computer-modelling-simulation",
    title: "Computer Modelling and Simulation",
    level: "intermediate",
  },
  {
    slug: "legacy-algorithm-complexity",
    title: "Algorithm and Complexity",
    level: "advanced",
  },
  {
    slug: "legacy-research-methodology-technical-writing",
    title: "Research Methodology and Technical Writing",
    level: "beginner",
  },
  {
    slug: "legacy-distributed-computing",
    title: "Distributed Computing",
    level: "advanced",
  },
].map((course) => ({
  ...course,
  summary: "A Computer Science course offered by Legacy University Okija. The university administrator manages its lessons and course materials.",
  subject: "Computer Science",
  provider: "Legacy University Okija",
  sourceUrl: "https://www.legacyuniversity.edu.ng/",
  licenseName: "University course materials; permissions vary",
  licenseUrl: "https://www.legacyuniversity.edu.ng/",
  attribution: "Legacy University Okija, Department of Computer Science. Confirm permission and attribution for each course material before reusing it.",
}));

const courseDetailsBySlug: Record<string, CourseDetails> = {
  "harvard-cs50x-2026": {
    description: "Harvard’s introduction to the intellectual enterprises of computer science and the art of programming, for students with or without prior programming experience. Topics include computational thinking, abstraction, algorithms, data structures, C, Python, SQL, and web development, culminating in a final project.",
    format: "Free OpenCourseWare for independent study, organized into eleven weeks. The official course recommends a workflow of lecture, section, shorts, problem set, and final project.",
    learningResourceTypes: ["Lectures", "Sections", "Shorts", "Problem Sets", "Final Project"],
    departments: [{ name: "Computer Science", url: "https://cs50.harvard.edu/x/2026/" }],
    topics: [
      { name: "Algorithms", url: "https://cs50.harvard.edu/x/2026/weeks/3/" },
      { name: "Data Structures", url: "https://cs50.harvard.edu/x/2026/weeks/4/" },
      { name: "Programming", url: "https://cs50.harvard.edu/x/2026/" },
    ],
    downloadUrl: "https://cs50.harvard.edu/x/2026/",
  },
  "stanford-cs106a": {
    description: "The largest of Stanford’s introductory programming courses, focused on engineering computer applications and modern software engineering principles: object-oriented design, decomposition, encapsulation, abstraction, and testing. It teaches Java and good programming style and requires no previous programming background.",
    format: "Stanford Engineering Everywhere publishes a 28-session lecture series, the syllabus, handouts, assignments, exams, software, and a downloadable archive of course materials.",
    learningResourceTypes: ["Syllabus", "Lecture Sessions (28)", "Handouts", "Assignments", "Exams", "Software", "Downloadable Course Archive"],
    instructors: [{ name: "Mehran Sahami", url: "https://see.stanford.edu/Course/CS106A" }],
    departments: [{ name: "Computer Science", url: "https://cs.stanford.edu/" }],
    topics: [
      { name: "Java", url: "https://see.stanford.edu/Course/CS106A" },
      { name: "Object-oriented Design", url: "https://see.stanford.edu/Course/CS106A" },
      { name: "Software Engineering", url: "https://see.stanford.edu/Course/CS106A" },
    ],
    downloadUrl: "https://see.stanford.edu/materials/icspmcs106a/ProgrammingMethodologyAllMaterials.zip",
  },
  "stanford-cs106b": {
    description: "Programming Abstractions is the successor to Programming Methodology. It develops recursion, algorithmic analysis, and data abstraction in C++, including modularity, object-oriented programming, fundamental data structures, recursive structures, and time and space complexity.",
    format: "Stanford Engineering Everywhere publishes a 27-session lecture series, a syllabus, handouts, assignments, exams, and a downloadable archive of course materials.",
    learningResourceTypes: ["Syllabus", "Lecture Sessions (27)", "Handouts", "Assignments", "Exams", "Downloadable Course Archive"],
    instructors: [{ name: "Julie Zelenski", url: "https://see.stanford.edu/Course/CS106B" }],
    departments: [{ name: "Computer Science", url: "https://cs.stanford.edu/" }],
    topics: [
      { name: "Recursion", url: "https://see.stanford.edu/Course/CS106B" },
      { name: "Data Abstraction", url: "https://see.stanford.edu/Course/CS106B" },
      { name: "Algorithm Analysis", url: "https://see.stanford.edu/Course/CS106B" },
      { name: "C++", url: "https://see.stanford.edu/Course/CS106B" },
    ],
    downloadUrl: "https://see.stanford.edu/materials/icspacs106b/ProgrammingAbstractionsAllMaterials.zip",
  },
  "mit-6-006-algorithms": {
    description: "An introductory course covering elementary data structures such as dynamic arrays, heaps, balanced binary search trees, and hash tables, alongside sorting, graph searching, and dynamic programming. It introduces mathematical modeling, algorithmic paradigms, and performance analysis, emphasizing the relationship between algorithms and programming.",
    format: "The syllabus specifies two lectures and two recitations per week. Course material is provided through lecture and recitation notes, problem sets, quizzes, and a final exam.",
    learningResourceTypes: ["Lecture Notes", "Recitation Notes", "Problem Sets", "Quizzes", "Final Exam"],
    textbook: {
      title: "Introduction to Algorithms (CLRS), 3rd edition",
      url: "https://mitpress.mit.edu/9780262033848/",
    },
    topics: [
      { name: "Algorithms", url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/" },
      { name: "Data Structures", url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/" },
    ],
  },
  "mit-6-046j-algorithms": {
    description: "An advanced study of the design and analysis of computer algorithms. Building on introductory algorithms, the course develops rigorous correctness proofs, asymptotic analysis, divide and conquer, dynamic programming, greedy algorithms, graph algorithms, randomized and approximation algorithms, amortized analysis, and competitive analysis.",
    format: "Two lectures and one recitation per week. The published grading components include problem sets, quizzes, and a final exam.",
    learningResourceTypes: ["Lecture Notes", "Recitations", "Problem Sets", "Quizzes", "Final Exam"],
    textbook: {
      title: "Introduction to Algorithms (CLRS), 3rd edition",
      url: "https://mitpress.mit.edu/9780262033848/",
    },
    topics: [
      { name: "Algorithm Design", url: "https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/" },
      { name: "Algorithm Analysis", url: "https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/" },
    ],
  },
  "mit-6-042j-math-computer-science": {
    description: "An introduction to discrete mathematics oriented toward computer science and engineering, divided into mathematical foundations (definitions, proofs, sets, and functions), discrete structures (number theory, graphs, and counting), and discrete probability.",
    format: "A flipped, team-based course: students prepare with readings and online questions, then spend class sessions solving problems in teams.",
    learningResourceTypes: ["Lecture Notes", "Readings", "Online Problems", "Team Problem-Solving Sessions", "Problem Sets"],
    topics: [
      { name: "Discrete Mathematics", url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/" },
      { name: "Probability", url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/" },
      { name: "Graph Theory", url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/" },
    ],
  },
  "mit-6-005-software-construction": {
    description: "Introduces fundamental principles and techniques of software development: writing software that is safe from bugs, easy to understand, and ready for change. Topics include specifications, invariants, testing, abstract data types, design patterns, concurrency, and functional programming.",
    format: "Two 90-minute lectures and one one-hour recitation each week. The course includes weekly programming exercises, group software projects, readings, and nanoquizzes.",
    learningResourceTypes: ["Readings", "Nanoquizzes", "Programming Exercises", "Problem Sets", "Group Projects", "Quizzes"],
    topics: [
      { name: "Software Engineering", url: "https://ocw.mit.edu/courses/6-005-software-construction-spring-2016/" },
      { name: "Testing", url: "https://ocw.mit.edu/courses/6-005-software-construction-spring-2016/" },
      { name: "Concurrency", url: "https://ocw.mit.edu/courses/6-005-software-construction-spring-2016/" },
    ],
  },
  "mit-6-004-computation-structures": {
    description: "Introduces digital-system engineering, developing building blocks from MOS transistors through logic gates, combinational and sequential circuits, finite-state machines, computers, and complete systems. The course explores hardware and software mechanisms through design examples.",
    format: "Two lectures and two recitations per week. The official syllabus includes problem sets and lab exercises, including a gate-level RISC processor design.",
    learningResourceTypes: ["Lectures", "Recitations", "Problem Sets", "Lab Exercises", "Tutorial Problems"],
    topics: [
      { name: "Digital Systems", url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/" },
      { name: "Computer Architecture", url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/" },
      { name: "Hardware Design", url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/" },
    ],
  },
  "mit-6-041sc-probability": {
    description: "An introduction to probabilistic modeling, random processes, and the basic elements of statistical inference. The course develops models, skills, and tools for analyzing data and making scientifically sound predictions under uncertainty, with applications across science, engineering, operations research, and management.",
    format: "Designed for independent study with lecture videos, slides and readings, recitation and tutorial practice with solutions, problem sets, and exams.",
    learningResourceTypes: ["Lecture Videos", "Lecture Slides", "Readings", "Recitation Problems and Solutions", "Tutorial Problems and Solutions", "Problem Sets with Solutions", "Exams with Solutions"],
    instructors: [{ name: "John Tsitsiklis", url: "https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/" }],
    topics: [
      { name: "Probability", url: "https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/" },
      { name: "Statistical Inference", url: "https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/" },
    ],
  },
  "mit-6-02-digital-communication": {
    description: "An introduction to electrical engineering and computer science through digital communication systems. It develops the three layers of bits, signals, and packets: coding and error correction, communication over noisy channels, and efficient and reliable networking.",
    format: "Two lectures and two recitations per week, with programming tasks and experiments using real-world communication channels.",
    learningResourceTypes: ["Lectures", "Recitations", "Problem Sets", "Programming Tasks", "Communication Experiments"],
    topics: [
      { name: "Digital Communication", url: "https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/" },
      { name: "Signals and Systems", url: "https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/" },
      { name: "Computer Networks", url: "https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/" },
    ],
  },
  "mit-6-087-c-programming": {
    description: "A practical introduction to C, the language used in UNIX and embedded systems. The course progresses from syntax and programming techniques to dynamic memory allocation, concurrency and synchronization, UNIX signals and process control, and library development.",
    format: "A three-week intensive course with five 90-minute lectures and one three-hour laboratory each week. The syllabus also specifies daily homework in the first two weeks, labs, and programming projects.",
    learningResourceTypes: ["Lecture Slides", "Homework Assignments", "Laboratory Exercises", "Programming Projects"],
    topics: [
      { name: "C Programming", url: "https://ocw.mit.edu/courses/6-087-practical-programming-in-c-january-iap-2010/" },
      { name: "Systems Programming", url: "https://ocw.mit.edu/courses/6-087-practical-programming-in-c-january-iap-2010/" },
    ],
  },
  "mit-6-189-python": {
    description: "A comprehensive, fast-paced introduction to programming with Python. The official syllabus emphasizes learning by attending lectures and labs, asking questions, and running code before submission.",
    format: "A three-week intensive course with four one-hour lectures and three two-hour labs each week. The official syllabus says there are no formal exams; it includes a take-home mini-quiz and required problem assignments.",
    learningResourceTypes: ["Lectures", "Labs", "Problem Sets", "Take-home Mini-quiz"],
    topics: [
      { name: "Python Programming", url: "https://ocw.mit.edu/courses/6-189-a-gentle-introduction-to-programming-using-python-january-iap-2011/" },
    ],
  },
  "mit-18-06sc-linear-algebra": {
    description: "This course covers matrix theory and linear algebra, emphasizing topics useful in other disciplines such as physics, economics and social sciences, natural sciences, and engineering. It parallels the combination of theory and applications in Professor Strang’s textbook Introduction to Linear Algebra.",
    format: "Open the official course page for the complete course format and syllabus.",
    textbook: {
      title: "Introduction to Linear Algebra",
      url: "http://math.mit.edu/~gs/linearalgebra/",
    },
    instructors: [
      { name: "Prof. Gilbert Strang", url: "https://ocw.mit.edu/search/?q=Prof.+Gilbert+Strang" },
    ],
    departments: [
      { name: "Mathematics", url: "https://ocw.mit.edu/search/?d=Mathematics" },
    ],
    topics: [
      { name: "Mathematics", url: "https://ocw.mit.edu/search/?t=Mathematics" },
      { name: "Linear Algebra", url: "https://ocw.mit.edu/search/?t=Linear+Algebra" },
    ],
    learningResourceTypes: ["Exam Solutions", "Exams", "Instructor Insights", "Lecture Notes", "Lecture Videos", "Problem Set Solutions", "Problem Sets", "Problem-solving Videos"],
    image: {
      url: "https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/ad862b68e2323331fd3ee944ed704f38_18-06scf11.jpg",
      alt: "Multi-colored cubes arranged to create the illusion of hexagons.",
      caption: "This optical illusion was seen on a restaurant floor in Paris and coded in MATLAB by Shev Macnamara.",
    },
    downloadUrl: "https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/download",
  },
  "mit-6-002-circuits-electronics": {
    description: "A first undergraduate course in electrical engineering introducing the lumped-circuit abstraction. Topics include resistive networks, sources, switches and MOS transistors, digital abstraction, amplifiers, energy storage, dynamic networks, and analog and digital circuit design and applications.",
    format: "The official description highlights design and laboratory exercises as significant parts of the course.",
    learningResourceTypes: ["Lectures", "Design Exercises", "Laboratory Exercises"],
    instructors: [
      { name: "Anant Agarwal", url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/" },
      { name: "Jeffrey H. Lang", url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/" },
    ],
    topics: [
      { name: "Electrical Engineering", url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/" },
      { name: "Analog and Digital Circuits", url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/" },
    ],
  },
  "mit-6-003-signals-systems": {
    description: "Covers signal and system analysis through discrete- and continuous-time signal representations, Fourier representations, Laplace and Z transforms, and sampling, alongside linear time-invariant systems and their responses. Applications include feedback and control, communications, and signal processing.",
    format: "Two lectures and two recitations per week. The syllabus lists three midterm exams, a final exam, and homework.",
    learningResourceTypes: ["Lectures", "Recitations", "Homework", "Midterm Exams", "Final Exam"],
    textbook: {
      title: "Signals and Systems, 2nd edition",
      url: "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/",
    },
    topics: [
      { name: "Signals and Systems", url: "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/" },
      { name: "Signal Processing", url: "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/" },
      { name: "Control Systems", url: "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/" },
    ],
  },
  "mit-6-011-communication-control-signal-processing": {
    description: "Builds on signals, systems, and probabilistic models to study applications in communication, control, and signal processing. Topics include random processes, spectral properties, state-space models, multirate processing, optimal estimation and detection, and observer-based controller design.",
    format: "Two lectures and two recitations per week, with homework, two evening quizzes, and a final examination.",
    learningResourceTypes: ["Exams", "Exam Solutions", "Open Textbooks", "Homework", "Quizzes"],
    instructors: [
      { name: "Alan V. Oppenheim", url: "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/" },
      { name: "George Verghese", url: "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/" },
    ],
    departments: [{ name: "Electrical Engineering and Computer Science", url: "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/" }],
    topics: [
      { name: "Communication", url: "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/" },
      { name: "Control", url: "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/" },
      { name: "Signal Processing", url: "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/" },
      { name: "Estimation and Detection", url: "https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/" },
    ],
  },
  "mit-6-034-artificial-intelligence": {
    description: "Introduces AI knowledge representation, problem-solving, and learning methods, with the goal of developing intelligent systems and understanding computational perspectives on human intelligence.",
    format: "The official syllabus describes lectures, mega-recitations, recitations, and tutorials, with programming problem sets, quizzes, and a final.",
    learningResourceTypes: ["Lecture Videos", "Problem-solving Videos", "Programming Assignments", "Exams", "Instructor Insights", "Mega-recitations", "Recitations", "Tutorials"],
    instructors: [{ name: "Patrick H. Winston", url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/" }],
    departments: [{ name: "Electrical Engineering and Computer Science", url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/" }],
    topics: [
      { name: "Artificial Intelligence", url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/" },
      { name: "Knowledge Representation", url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/" },
      { name: "Problem-solving and Learning", url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/" },
      { name: "Models of Human Intelligence", url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/" },
    ],
  },
  "mit-6-045j-automata-computability": {
    description: "Introduces central ideas in theoretical computer science and computational models: which problems they can solve and how their computational power differs. The topic sequence spans finite automata, Turing machines, computability, complexity, randomness, cryptography, learning theory, and quantum computing.",
    format: "Two lectures and one recitation per week. The syllabus lists six to seven problem sets, a midterm, a final exam, and class participation.",
    learningResourceTypes: ["Syllabus", "Lecture Notes", "Problem Sets", "Assignments", "Midterm Exam", "Final Exam"],
    instructors: [{ name: "Scott Aaronson", url: "https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/" }],
    departments: [
      { name: "Electrical Engineering and Computer Science", url: "https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/" },
      { name: "Mathematics", url: "https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/" },
    ],
    topics: [
      { name: "Theory of Computation", url: "https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/" },
      { name: "Computational Complexity", url: "https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/" },
    ],
  },
  "mit-6-828-operating-system-engineering": {
    description: "Studies fundamental operating-system design and implementation using UNIX and research papers. Topics include virtual memory, threads, context switches, kernels, interrupts, system calls, interprocess communication, coordination, and software-hardware interaction. Individual labs implement a small operating system in C with some x86 assembly.",
    format: "The official course description centers on lectures, research-paper study, and individual systems programming labs.",
    learningResourceTypes: ["Lectures", "Lecture Notes and Readings", "Individual Laboratory Assignments"],
    instructors: [{ name: "Frans Kaashoek", url: "https://ocw.mit.edu/courses/6-828-operating-system-engineering-fall-2012/" }],
    departments: [{ name: "Electrical Engineering and Computer Science", url: "https://ocw.mit.edu/courses/6-828-operating-system-engineering-fall-2012/" }],
    topics: [
      { name: "Operating Systems", url: "https://ocw.mit.edu/courses/6-828-operating-system-engineering-fall-2012/" },
      { name: "Computer Systems", url: "https://ocw.mit.edu/courses/6-828-operating-system-engineering-fall-2012/" },
    ],
  },
  "mit-6-170-software-engineering": {
    description: "Introduces concepts and techniques for producing large software systems using abstractions. Topics include modularity, specification, data abstraction, object modeling, design patterns, and testing; students complete programming projects individually and in groups.",
    format: "Three lectures and one recitation per week, with weekly problem sets in the first half of the term, a quiz, and a team final project.",
    learningResourceTypes: ["Syllabus", "Readings", "Lecture Notes", "Assignments", "Programming Projects", "Quiz"],
    instructors: [
      { name: "Daniel Jackson", url: "https://ocw.mit.edu/courses/6-170-laboratory-in-software-engineering-fall-2005/" },
      { name: "Srini Devadas", url: "https://ocw.mit.edu/courses/6-170-laboratory-in-software-engineering-fall-2005/" },
    ],
    departments: [{ name: "Electrical Engineering and Computer Science", url: "https://ocw.mit.edu/courses/6-170-laboratory-in-software-engineering-fall-2005/" }],
    topics: [
      { name: "Software Engineering", url: "https://ocw.mit.edu/courses/6-170-laboratory-in-software-engineering-fall-2005/" },
      { name: "Software Design", url: "https://ocw.mit.edu/courses/6-170-laboratory-in-software-engineering-fall-2005/" },
      { name: "Testing", url: "https://ocw.mit.edu/courses/6-170-laboratory-in-software-engineering-fall-2005/" },
    ],
  },
};

const starterLessons = [
  {
    courseSlug: "harvard-cs50x-2026",
    title: "Algorithms: search and efficiency",
    body: "This original LearnFlow lesson introduces a foundational idea in computer science. An algorithm is a repeatable set of steps for solving a problem. To compare algorithms, ask both whether they produce the right answer and how their work grows as the input gets larger.\n\nChecking names one at a time in an unsorted list may require looking at every entry. If the list is sorted, binary search repeatedly checks the middle and discards half of the remaining entries, so it can find a value with fewer checks.\n\nBinary search relies on sorted input: without that ordering, discarding half the list is not safe.",
    quizQuestion: "What must be true before binary search can safely discard half of a list?",
    quizOptions: ["The list is sorted.", "The list contains fewer than ten items.", "The list is in a random order."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "stanford-cs106a",
    title: "Programming foundations: state and functions",
    body: "A program transforms input into output by following explicit instructions. Variables give names to values, while functions package a sequence of operations behind a meaningful name. A function can accept parameters and return a result, making it possible to reuse a computation with different inputs.\n\nConsider a function that converts a temperature from Celsius to Fahrenheit. Keeping that calculation in one function avoids repeating the formula in every place that needs it. Small functions are easier to test because their inputs and outputs can be examined independently.",
    quizQuestion: "What is a useful reason to place a repeated calculation in a function?",
    quizOptions: ["It gives the calculation a reusable, testable boundary.", "It guarantees the program uses less memory.", "It removes the need to choose input values."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "stanford-cs106b",
    title: "Abstract data types and invariants",
    body: "An abstract data type describes what operations a collection supports without requiring callers to know how its data is stored. A stack, for example, exposes operations such as push and pop while hiding whether its elements live in an array or a linked structure.\n\nAn invariant is a condition that must remain true whenever an operation finishes. For a stack, the size cannot be negative, and popping an empty stack must follow a defined policy. Clear invariants make implementations easier to reason about and help tests catch mistakes at the boundary.",
    quizQuestion: "What does an invariant provide for an abstract data type?",
    quizOptions: ["A condition that operations must preserve.", "A promise that every operation takes constant time.", "A specific required memory layout."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-006-algorithms",
    title: "Choosing an algorithm by growth rate",
    body: "An algorithm's running time often depends on the input size n. A linear scan may perform work proportional to n, while a divide-and-conquer search on sorted data can reduce the remaining candidates by half at each step. Big-O notation describes an upper-bound growth pattern while ignoring machine-specific timing details.\n\nFor large inputs, the shape of that growth can matter more than a small constant-factor speedup. Before optimizing, identify the input size, the dominant repeated operation, and the assumptions that make the algorithm correct.",
    quizQuestion: "Why can growth rate matter more than a small constant-factor improvement for large inputs?",
    quizOptions: ["Different growth rates diverge as input size increases.", "Big-O specifies the exact number of processor cycles.", "A constant factor changes an algorithm's correctness."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-046j-algorithms",
    title: "Greedy choices and proof obligations",
    body: "A greedy algorithm commits to a locally attractive choice at each step. This strategy can be efficient, but a locally good choice does not automatically produce a globally optimal solution. Correctness requires an argument that the choice is safe for every valid input.\n\nOne proof technique is an exchange argument: compare an optimal solution with one that takes the greedy choice, then show how to replace part of the optimal solution without making it worse. If that reasoning cannot be established, test small counterexamples and consider a different strategy such as dynamic programming.",
    quizQuestion: "What must be shown to justify a greedy algorithm?",
    quizOptions: ["That each greedy choice can lead to an optimal solution.", "That it makes the fewest lines of code.", "That it never sorts or compares values."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-042j-math-computer-science",
    title: "Proofs by induction",
    body: "Mathematical induction proves a statement for every natural number by establishing a base case and an inductive step. The base case checks the first value. The step assumes the statement holds for an arbitrary value n and uses that assumption to prove it for n+1.\n\nThe assumption is temporary and specific to the proof step; it is not a claim that the result is already true for all values. Induction is useful for reasoning about recursively defined objects and algorithms whose behavior grows one element at a time.",
    quizQuestion: "What are the two essential parts of a standard induction proof?",
    quizOptions: ["A verified base case and a step from n to n+1.", "A graph and a matrix.", "A counterexample and a performance benchmark."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-005-software-construction",
    title: "Designing a function contract",
    body: "A function contract explains what a caller may assume and what the function promises in return. Preconditions describe valid inputs; postconditions describe the result when those preconditions hold. Stating these expectations makes functions easier to test and compose.\n\nFor a function that returns the largest value in a non-empty list, the contract should say that the list must contain at least one element and that the returned value is at least as large as every list element. Tests can then cover ordinary inputs and boundary cases such as a one-element list.",
    quizQuestion: "What belongs in a function's precondition?",
    quizOptions: ["Requirements callers must satisfy before invoking it.", "The exact CPU time it will consume.", "A list of unrelated implementation details."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-004-computation-structures",
    title: "From logic gates to stored state",
    body: "Combinational logic produces outputs from the current inputs: an AND gate, for example, outputs 1 only when both inputs are 1. Sequential circuits add storage, so their outputs can depend on values from an earlier moment as well as current inputs.\n\nA clocked register captures a bit pattern at a chosen clock edge and holds it until a later update. Connecting registers with combinational logic creates a simple datapath that transforms stored values over successive cycles. Timing matters because signals need time to settle before the next capture.",
    quizQuestion: "What distinguishes a sequential circuit from a purely combinational one?",
    quizOptions: ["It can retain information from an earlier state.", "It always contains more than one output.", "Its output is unrelated to its current inputs."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-041sc-probability",
    title: "Conditional probability and evidence",
    body: "Conditional probability measures the chance of an event when some evidence is already known. If A and B are events and B has nonzero probability, then P(A given B) equals P(A and B) divided by P(B). The condition changes the population being considered.\n\nThis is why P(A given B) is generally different from P(B given A). For example, the fraction of rainy days that are cold need not match the fraction of cold days that are rainy. Always identify which event is the evidence and which probability is being asked for.",
    quizQuestion: "In P(A given B), which event is treated as known evidence?",
    quizOptions: ["B", "A", "Neither event"],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-02-digital-communication",
    title: "Bits, noise, and error detection",
    body: "A communication system represents information as symbols, sends them through a channel, and reconstructs a message at the receiver. Noise can change symbols in transit. Adding structured redundancy can help detect or correct some errors.\n\nA simple parity bit makes the count of 1-bits even or odd according to a chosen rule. If one bit flips, the parity check will usually detect an inconsistency, although it cannot identify every possible error pattern. Error detection and error correction are different capabilities, so system designers choose redundancy according to channel conditions and cost.",
    quizQuestion: "What can a simple parity check reliably help a receiver do?",
    quizOptions: ["Detect many single-bit errors.", "Recover every possible corrupted message.", "Increase the physical transmission speed."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-087-c-programming",
    title: "C memory: objects and pointers",
    body: "In C, an object occupies storage and has a type and lifetime. A pointer stores the address of an object; it does not automatically own or manage that object's lifetime. Dereferencing a pointer is valid only when it points to a live object of a compatible type.\n\nA common source of bugs is returning a pointer to a local variable whose lifetime has ended. Another is using dynamically allocated memory after it has been freed. Make ownership and lifetime decisions explicit, and use tools and focused tests to find invalid memory access.",
    quizQuestion: "Why is returning the address of a local variable unsafe?",
    quizOptions: ["The local object's lifetime ends when the function returns.", "Pointers cannot store addresses.", "The returned address is automatically converted to text."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-189-python",
    title: "Python data: names and mutable objects",
    body: "In Python, a variable name refers to an object rather than acting as a box that permanently contains a value. Two names can refer to the same mutable object, such as a list. Mutating that list through either name is visible through the other reference.\n\nThis distinction helps explain why changing a list passed into a function can affect the caller's data. If independent data is needed, create a copy deliberately. Immutable values such as integers cannot be changed in place, so operations that appear to update them produce a new value instead.\n\nOpen-text excerpt (verbatim): “A program is a sequence of instructions that specifies how to perform a computation.” — Allen B. Downey, Think Python, 2nd edition, Chapter 1. Source: https://greenteapress.com/thinkpython2/html/thinkpython2002.html. License: Creative Commons Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0), https://creativecommons.org/licenses/by-nc/3.0/. The excerpt is unchanged; the surrounding lesson and quiz are original LearnFlow material.",
    quizQuestion: "If two Python names refer to the same list, what happens when that list is mutated through one name?",
    quizOptions: ["The change is visible through both names.", "Python automatically creates a separate list for the other name.", "The mutation is rejected because lists are immutable."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-18-06sc-linear-algebra",
    title: "Matrices as transformations",
    body: "A matrix can represent a linear transformation that maps vectors to vectors. Multiplying a matrix by a vector combines the matrix's columns using the vector's entries as weights. Thinking in columns makes it easier to see how the transformation moves the coordinate basis vectors.\n\nMatrix multiplication represents composition: applying one transformation and then another can be represented by a product of their matrices, with order mattering. In general, reversing the order changes the result because transformations need not commute.",
    quizQuestion: "What does a matrix product commonly represent?",
    quizOptions: ["The composition of two linear transformations.", "The sum of the matrix dimensions.", "A guarantee that the two transformations commute."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-002-circuits-electronics",
    title: "Voltage, current, and resistance",
    body: "Voltage describes electrical potential difference between two points, while current measures the rate of charge flow. For an ideal resistor, Ohm's law relates them as V = I times R. This relation is useful only when the component behaves approximately like a resistor in the conditions being studied.\n\nCircuit analysis also depends on consistent reference directions and signs. Choose voltage polarities and current directions, write the circuit equations, and interpret a negative result as indicating that the actual direction is opposite to the chosen reference.",
    quizQuestion: "For an ideal resistor, what does Ohm's law relate?",
    quizOptions: ["Voltage, current, and resistance.", "Charge, frequency, and capacitance only.", "Power and time without current or voltage."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-003-signals-systems",
    title: "Impulse response and system behavior",
    body: "A system's impulse response describes its output when the input is an idealized impulse. For a linear time-invariant system, this response contains enough information to determine the output for other inputs through convolution.\n\nConvolution combines shifted, scaled copies of the impulse response according to the input signal. This viewpoint turns system analysis into a reusable operation: characterize the system once, then use that characterization to predict its response to different inputs. Discrete-time and continuous-time versions follow the same conceptual pattern.\n\nOpen-text excerpt (verbatim): “A signal represents a quantity that varies in time.” — Allen B. Downey, Think DSP, Chapter 1. Source: https://greenteapress.com/thinkdsp/html/thinkdsp002.html. License: Creative Commons Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0), https://creativecommons.org/licenses/by-nc/3.0/. The excerpt is unchanged; the surrounding lesson and quiz are original LearnFlow material.",
    quizQuestion: "For a linear time-invariant system, what role does the impulse response play?",
    quizOptions: ["It can be used with convolution to determine outputs for other inputs.", "It specifies only the system's physical size.", "It proves the system has no response to any input."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-011-communication-control-signal-processing",
    title: "Feedback and stability intuition",
    body: "A feedback controller compares a measured output with a desired target and uses the error to adjust the input. Negative feedback can reduce the effect of disturbances, but its behavior depends on system dynamics, delay, and controller settings.\n\nA controller that reacts too aggressively may cause oscillation rather than settle toward the target. Engineers analyze stability before deployment and test with realistic disturbances. The design goal is not merely to make the error small in one instant, but to produce a dependable response over time.",
    quizQuestion: "What can an overly aggressive feedback controller cause?",
    quizOptions: ["Oscillation or unstable behavior.", "A guarantee that all disturbances disappear instantly.", "A system with no measured output."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-034-artificial-intelligence",
    title: "Search spaces and informed choices",
    body: "Many artificial intelligence problems can be represented as a search through possible states. A search algorithm tracks which states have been reached and applies actions to generate new candidates. The way states are represented can strongly affect how much work the search requires.\n\nA heuristic estimates how promising a state is relative to a goal. It can guide exploration toward useful candidates, but the estimate is not itself proof that a path is optimal. When optimality matters, the algorithm's assumptions about the heuristic must be checked.",
    quizQuestion: "What is the usual role of a heuristic in search?",
    quizOptions: ["Estimate which states may be more promising to explore.", "Guarantee a solution exists in every problem.", "Replace the need to define states and actions."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-045j-automata-computability",
    title: "Finite automata and regular patterns",
    body: "A deterministic finite automaton consists of a finite set of states, an input alphabet, a transition rule, a start state, and a set of accepting states. Reading one symbol moves the machine to its next state. After the input ends, the machine accepts if its current state is accepting.\n\nThis model recognizes regular languages and is useful for describing patterns that can be checked with finite memory. It cannot remember an arbitrarily large count, which distinguishes it from stronger computational models.",
    quizQuestion: "What determines whether a finite automaton accepts an input string?",
    quizOptions: ["Whether the final state after reading the string is accepting.", "Whether the string has an even number of characters in every case.", "Whether every transition returns to the start state."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-828-operating-system-engineering",
    title: "Processes and isolation",
    body: "An operating system gives each process an execution context and a protected address space. This separation helps prevent one program from directly overwriting another program's memory. The operating system mediates access to shared resources such as files and devices.\n\nA process switch saves enough state to pause one computation and resume another. Isolation improves reliability, but communication between processes still needs explicit mechanisms such as pipes, sockets, or shared memory with coordination.",
    quizQuestion: "What is one purpose of a process address space?",
    quizOptions: ["To isolate a process's memory from other processes.", "To guarantee that a process never waits.", "To replace all operating-system resource management."],
    quizAnswerIndex: 0,
  },
  {
    courseSlug: "mit-6-170-software-engineering",
    title: "Testing behavior at boundaries",
    body: "A good test checks observable behavior against an expectation rather than duplicating the implementation step by step. Boundary cases are especially valuable because bugs often appear where assumptions change: empty input, a single element, the largest supported value, or a missing optional field.\n\nSeparate tests should cover distinct behaviors so that a failure points toward a small part of the design. When a defect is found, first create a test that reproduces it, then make the smallest correction and rerun both the focused test and the broader suite.",
    quizQuestion: "Why are boundary cases useful in software tests?",
    quizOptions: ["They exercise places where assumptions and behavior often change.", "They guarantee the program has no bugs.", "They eliminate the need to test normal input."],
    quizAnswerIndex: 0,
  },
];

type LessonContent = Omit<(typeof starterLessons)[number], "courseSlug">;

const courseLessonPacks: Record<string, LessonContent[]> = {
  programming: [
    { title: "Decomposing a problem into steps", body: "Before writing code, state what the program receives, what it must produce, and what rules connect them. Split the goal into smaller operations that can be checked independently. A useful first implementation may handle one small case; then expand it to cover the full input range.\n\nWrite down assumptions explicitly. For example, a function that averages values should define what happens when the collection is empty. Clear assumptions prevent a program from silently producing a misleading answer.", quizQuestion: "What is a useful first step when turning a problem into a program?", quizOptions: ["Define the inputs, desired outputs, and assumptions.", "Choose variable names before understanding the goal.", "Add loops until the program appears to work."], quizAnswerIndex: 0 },
    { title: "Iteration and loop invariants", body: "A loop repeats a body while a condition holds. To reason about it, identify what is true before the first iteration, what each iteration changes, and why the loop eventually stops. A loop invariant is a condition that remains true at the start of every iteration.\n\nFor a running total, an invariant might say that the total equals the sum of all values processed so far. At termination, combine the invariant with the stopping condition to conclude that the final answer is correct.", quizQuestion: "What does a loop invariant help establish?", quizOptions: ["That a property remains true across iterations.", "That the loop always runs exactly ten times.", "That variables never change in a loop."], quizAnswerIndex: 0 },
    { title: "Functions, parameters, and return values", body: "A function gives a computation a name and a boundary. Parameters describe the information it needs; a return value communicates its result. Keeping a function focused makes its behavior easier to test and reuse.\n\nPrefer explicit inputs and outputs over hidden dependencies on global state. When a function has too many responsibilities, separate the independent decisions into smaller functions with clear contracts.", quizQuestion: "Why should a function expose inputs through parameters?", quizOptions: ["So its dependencies and behavior are easier to understand and test.", "So it can only be called once.", "So it no longer needs to return a value."], quizAnswerIndex: 0 },
    { title: "Debugging with a minimal example", body: "When a program behaves incorrectly, first reproduce the behavior with the smallest input that still fails. Compare the actual result with the expected result, then inspect the data at the boundary where the two begin to differ.\n\nA minimal failing example removes unrelated code and makes a cause easier to isolate. After fixing the defect, keep the example as a regression test so the same failure is less likely to return.", quizQuestion: "Why reduce a bug to a minimal failing example?", quizOptions: ["It isolates the cause by removing unrelated behavior.", "It proves the entire application is correct.", "It avoids checking the expected result."], quizAnswerIndex: 0 },
  ],
  algorithms: [
    { title: "Asymptotic analysis", body: "Asymptotic analysis studies how resource use grows with input size. Big-O notation gives an upper-bound growth class while ignoring machine details and constant factors. A loop that examines every item is typically linear; two nested full scans are often quadratic.\n\nThe analysis depends on the operation counted and the input model. State those assumptions, and distinguish worst-case behavior from average-case behavior when that distinction matters.", quizQuestion: "What does Big-O primarily describe?", quizOptions: ["How an algorithm's resource use grows with input size.", "The exact runtime on every computer.", "The number of lines in the implementation."], quizAnswerIndex: 0 },
    { title: "Sorting and ordering guarantees", body: "Sorting arranges values according to a comparison rule. Different algorithms trade time, memory, and implementation complexity. A stable sort preserves the original relative order of equal-key items, which can matter when records have multiple fields.\n\nBefore selecting a sort, ask whether the input is already partially ordered, whether extra memory is acceptable, and whether stability is required. Verify that the comparison rule is consistent, or the resulting order may be surprising.", quizQuestion: "What does stability guarantee in a sorting algorithm?", quizOptions: ["Equal-key items keep their previous relative order.", "The algorithm always uses constant memory.", "The input can never contain duplicates."], quizAnswerIndex: 0 },
    { title: "Graphs and traversal", body: "A graph models relationships using vertices and edges. Edges may be directed or undirected, weighted or unweighted. Breadth-first search explores by distance in edges and finds shortest paths in an unweighted graph; depth-first search explores one branch deeply before backtracking.\n\nA visited set prevents repeated work in graphs with cycles. The chosen representation, such as an adjacency list or matrix, affects memory use and the cost of finding neighbors.", quizQuestion: "Which traversal finds shortest paths by number of edges in an unweighted graph?", quizOptions: ["Breadth-first search.", "Depth-first search in every case.", "A traversal that never marks visited vertices."], quizAnswerIndex: 0 },
    { title: "Dynamic programming and subproblems", body: "Dynamic programming is useful when a problem can be broken into overlapping subproblems and an optimal answer can be composed from their answers. Memoization stores results during recursion; tabulation fills a table in a chosen dependency order.\n\nA sound design begins by defining the state precisely, writing the recurrence, and identifying base cases. Then estimate the number of states and the work per state to understand time and space costs.", quizQuestion: "What is the benefit of caching overlapping subproblem results?", quizOptions: ["It avoids recomputing the same subproblem repeatedly.", "It guarantees every algorithm is linear.", "It removes the need for base cases."], quizAnswerIndex: 0 },
  ],
  discrete: [
    { title: "Sets, relations, and functions", body: "A set is a collection of distinct elements. A relation describes which pairs of elements are connected; a function is a relation that assigns each allowed input exactly one output. These definitions help make program data models and mathematical statements precise.\n\nWhen reasoning about a function, identify its domain and codomain. Two functions with identical formulas but different domains are not necessarily the same mapping.", quizQuestion: "What distinguishes a function from a general relation?", quizOptions: ["Every allowed input maps to exactly one output.", "Every output must have two inputs.", "The input and output sets must be identical."], quizAnswerIndex: 0 },
    { title: "Counting with bijections", body: "A bijection pairs every element of one finite set with exactly one element of another, with no leftovers. Therefore, the two sets have the same size. Constructing a bijection can turn a difficult counting problem into a simpler one.\n\nWhen counting arrangements, define clearly what counts as a distinct outcome. If order matters, swapping positions creates a different arrangement; if order does not matter, it may not.", quizQuestion: "What does a bijection between two finite sets establish?", quizOptions: ["The sets have equal cardinality.", "One set must contain more elements.", "The sets have the same element names."], quizAnswerIndex: 0 },
    { title: "Graphs, paths, and connectivity", body: "A path is a sequence of vertices joined by edges. A graph is connected if every pair of vertices has a path between them. A cycle returns to its starting vertex without repeating intermediate vertices.\n\nThese concepts model networks, dependencies, and routes. For a directed graph, reachability follows edge directions; connectivity notions must therefore specify whether direction is respected or ignored.", quizQuestion: "What does it mean for an undirected graph to be connected?", quizOptions: ["Every pair of vertices has a path between them.", "Every vertex has exactly one edge.", "The graph contains no cycles."], quizAnswerIndex: 0 },
    { title: "Modular arithmetic", body: "Congruence modulo m groups integers by their remainder after division by m. Two integers are congruent modulo m when their difference is divisible by m. Arithmetic can be performed on these equivalence classes while reducing results modulo m.\n\nModular arithmetic appears in hashing, cyclic schedules, and cryptography. Division requires extra care: a multiplicative inverse exists only when the value and modulus are relatively prime.", quizQuestion: "When are integers a and b congruent modulo m?", quizOptions: ["When m divides their difference.", "When both are positive.", "When their sum equals m."], quizAnswerIndex: 0 },
  ],
  software: [
    { title: "Specifications and preconditions", body: "A specification describes externally visible behavior without prescribing every implementation detail. Preconditions state what must be true before an operation; postconditions describe what it guarantees afterward.\n\nFor a search function, a specification should say whether the input must be sorted and what result indicates that a value is absent. Precise contracts support independent implementation, testing, and review.", quizQuestion: "What does a postcondition describe?", quizOptions: ["A guarantee after an operation completes under its preconditions.", "A requirement that applies only before calling it.", "The programming language used to implement it."], quizAnswerIndex: 0 },
    { title: "Modularity and dependency direction", body: "A module groups related responsibilities behind a small interface. Good boundaries hide implementation choices and limit the number of components that must change together.\n\nDependencies should point toward stable abstractions where practical. If every module depends on internal details of every other module, even a small change can create a broad cascade of breakage.", quizQuestion: "What is one benefit of a stable module interface?", quizOptions: ["Callers can use the module without depending on its internals.", "It removes the need to test the module.", "It forces all modules to share one implementation."], quizAnswerIndex: 0 },
    { title: "Test design and coverage", body: "A test suite samples behavior; it cannot prove correctness merely by having many tests. Select cases from the specification: typical inputs, boundaries, invalid inputs, and known regression failures. Keep each test focused on an observable outcome.\n\nCoverage measures which code ran, not whether the behavior was tested well. A high coverage number can coexist with weak assertions, so review both execution coverage and the quality of expected results.", quizQuestion: "Why is code coverage alone insufficient to show test quality?", quizOptions: ["Executed code may not have meaningful assertions.", "Coverage counts how many requirements are documented.", "A covered line cannot contain a defect."], quizAnswerIndex: 0 },
    { title: "Version control as a change history", body: "Version control records a sequence of changes so developers can inspect, compare, and revert work. A useful commit represents a coherent change and explains its intent. Small, focused commits make review and diagnosis easier.\n\nBranches allow work to proceed independently before integration. Conflicts are resolved by understanding both changes rather than blindly choosing one side, then running relevant tests after the merge.", quizQuestion: "Why keep version-control changes focused and coherent?", quizOptions: ["They are easier to review, understand, and revert.", "They guarantee changes will never conflict.", "They replace the need for backups and tests."], quizAnswerIndex: 0 },
  ],
  architecture: [
    { title: "Binary representation and logic", body: "Digital systems represent information using discrete values, commonly bits 0 and 1. Binary positional notation assigns each bit a power-of-two weight. Logic gates transform bit inputs according to Boolean operations such as AND, OR, and NOT.\n\nA group of bits can encode numbers, instructions, or characters, but the interpretation depends on the chosen representation. The bit pattern alone does not identify its meaning.", quizQuestion: "Why can the same bit pattern have different meanings?", quizOptions: ["Its interpretation depends on the representation and context.", "Bits change meaning randomly on each read.", "Binary values cannot represent numbers."], quizAnswerIndex: 0 },
    { title: "Instruction sets and machine state", body: "An instruction set architecture defines the operations visible to machine-language programs, including instructions, registers, and memory behavior. An implementation executes those instructions using internal hardware structures that may differ across processors.\n\nSeparating architecture from implementation allows different processors to run compatible programs while using different pipelines or caches. Correctness still depends on the architectural behavior being preserved.", quizQuestion: "What does an instruction set architecture specify?", quizOptions: ["The programmer-visible machine operations and state.", "Every physical transistor placement.", "The source code of every application."], quizAnswerIndex: 0 },
    { title: "Memory hierarchy and locality", body: "Processors use a hierarchy of storage, from small fast caches to larger main memory and persistent storage. Caches exploit temporal locality—recently used data may be used again—and spatial locality—nearby data may be accessed soon.\n\nA cache miss requires fetching data from a slower level. Programs that access arrays sequentially often use spatial locality well, while unpredictable access patterns can make memory latency more visible.", quizQuestion: "What is spatial locality?", quizOptions: ["Nearby memory locations are likely to be accessed close together in time.", "A cache always stores every program variable.", "Data remains permanently in a processor register."], quizAnswerIndex: 0 },
    { title: "Pipelines and hazards", body: "A pipeline overlaps stages of multiple instructions to improve throughput. It does not necessarily reduce the latency of one instruction. Hazards occur when an instruction cannot safely proceed because of a data dependency, control decision, or resource conflict.\n\nHardware or compiler techniques may stall, forward values, or predict branches to manage hazards. Performance analysis must account for these disruptions rather than assuming every stage remains full.", quizQuestion: "What is a pipeline hazard?", quizOptions: ["A condition that prevents the next instruction from proceeding as planned.", "A guarantee that every instruction finishes in one cycle.", "A type of persistent storage."], quizAnswerIndex: 0 },
  ],
  probability: [
    { title: "Random variables and distributions", body: "A random variable maps outcomes of an experiment to numerical values. Its probability distribution describes the likelihood of those values. Discrete variables assign probability to individual values; continuous variables are described with a density over intervals.\n\nThe expected value is a probability-weighted average, not necessarily a value that the variable can actually take. Variance describes spread around the mean and is measured in squared units.", quizQuestion: "What does a probability distribution describe?", quizOptions: ["How probability is assigned to possible random-variable values.", "The order in which experiments must be run.", "A guarantee that every outcome is equally likely."], quizAnswerIndex: 0 },
    { title: "Independence and conditional information", body: "Two events are independent when learning that one occurred does not change the probability of the other. Formally, for events with nonzero probabilities, independence means P(A and B) equals P(A) times P(B).\n\nIndependence is a modeling assumption, not a consequence of using different names for events. Shared causes or sampling without replacement can make events dependent.", quizQuestion: "What does independence mean for events A and B?", quizOptions: ["Knowing one event occurred does not change the probability of the other.", "The events cannot occur at the same time.", "Both events must have probability one-half."], quizAnswerIndex: 0 },
    { title: "Bayes' rule and updating beliefs", body: "Bayes' rule relates a hypothesis to observed evidence: posterior probability is proportional to likelihood times prior probability. The prior represents uncertainty before the evidence; the likelihood describes how probable the evidence is under the hypothesis.\n\nA rare condition can still have a low posterior probability after a positive test if false positives are common relative to the condition's prevalence. Keep base rates in the calculation rather than focusing only on test accuracy.", quizQuestion: "What information does a prior probability represent?", quizOptions: ["Belief about a hypothesis before considering the current evidence.", "The probability that the evidence was recorded incorrectly.", "The final posterior after all future observations."], quizAnswerIndex: 0 },
    { title: "Sampling and uncertainty", body: "A sample is a subset of a population used to estimate population properties. Random sampling helps reduce systematic selection bias, but estimates still vary from sample to sample.\n\nA confidence interval describes a procedure's long-run coverage under its assumptions; it is not a guarantee that a particular interval contains a fixed parameter with a specified probability. Study design and data quality matter as much as calculation.", quizQuestion: "What does random sampling primarily help reduce?", quizOptions: ["Systematic selection bias.", "All uncertainty in an estimate.", "The size of the population."], quizAnswerIndex: 0 },
  ],
  communications: [
    { title: "Sampling and quantization", body: "Sampling measures a continuous-time signal at discrete time intervals. The sampling rate determines how many measurements are collected per second. Quantization maps each measured amplitude to one of a finite set of representable levels.\n\nSampling and quantization introduce different constraints. Too low a sampling rate can make distinct frequency components indistinguishable, while coarse quantization introduces amplitude error.", quizQuestion: "What does quantization do?", quizOptions: ["Maps measured amplitudes to a finite set of levels.", "Chooses the time interval between samples.", "Removes every source of transmission noise."], quizAnswerIndex: 0 },
    { title: "Encoding and bandwidth tradeoffs", body: "An encoder maps information symbols to a representation suitable for transmission or storage. Redundant coding can improve reliability, but it uses extra bits or bandwidth. Compression can reduce the representation size, though lossy compression may discard information.\n\nChoose a coding scheme by considering the channel, error tolerance, latency, and resource limits. There is no single encoding that is optimal for every communication setting.", quizQuestion: "What is a common cost of adding error-correcting redundancy?", quizOptions: ["More transmitted bits or bandwidth.", "Guaranteed zero transmission delay.", "Loss of all ability to detect errors."], quizAnswerIndex: 0 },
    { title: "Noise, signal-to-noise ratio, and detection", body: "A receiver observes a signal mixed with noise and must decide which transmitted symbol is most likely. Signal-to-noise ratio compares signal power with noise power; a higher ratio often makes detection easier, though the channel and encoding also matter.\n\nDetection thresholds create tradeoffs between missed signals and false alarms. Select a threshold based on the costs of each error, not merely on which choice gives the fewest errors in one sample.", quizQuestion: "What does a detection threshold help control?", quizOptions: ["The tradeoff between missed detections and false alarms.", "The physical length of the cable.", "The number of bits in an integer type."], quizAnswerIndex: 0 },
    { title: "Feedback control and stability", body: "A feedback system measures its output, compares it to a target, and uses the error to adjust its input. Feedback can compensate for disturbances, but delays and excessive gain can cause oscillation or instability.\n\nA model helps predict responses, while experiments validate whether the model matches the physical system. Stability should be checked across expected operating conditions rather than assumed from one successful run.", quizQuestion: "What can excessive feedback gain combined with delay cause?", quizOptions: ["Oscillation or instability.", "A guarantee that all disturbances vanish immediately.", "A system with no feedback signal."], quizAnswerIndex: 0 },
  ],
  cProgramming: [
    { title: "Pointers and array traversal", body: "An array stores a sequence of elements in contiguous memory. In many C expressions, an array name converts to a pointer to its first element, and pointer arithmetic advances in units of the pointed-to type.\n\nThe valid range still matters: forming or dereferencing a pointer outside the permitted array bounds is undefined behavior. Track the element count separately and test both the first and last valid positions.", quizQuestion: "What does adding one to a pointer to an element type do?", quizOptions: ["Advances by one element of that type.", "Always advances by one byte.", "Moves the pointer to the next allocated object."], quizAnswerIndex: 0 },
    { title: "Dynamic allocation and ownership", body: "Dynamic allocation requests storage whose lifetime is controlled explicitly. In C, successful allocation must eventually be paired with a suitable release unless ownership is transferred. Failed allocation must also be handled before using the returned pointer.\n\nDocument which function owns allocated memory and which function is responsible for releasing it. Clear ownership rules reduce leaks, double frees, and use-after-free errors.", quizQuestion: "What should happen to dynamically allocated memory when it is no longer needed?", quizOptions: ["The responsible owner should release it exactly once.", "It should be released every time any pointer is copied.", "It should remain allocated until the operating system restarts."], quizAnswerIndex: 0 },
    { title: "Structs and representation invariants", body: "A struct groups related fields into one value. The representation is an implementation choice; a public interface can expose operations while hiding internal fields when stronger encapsulation is needed.\n\nA representation invariant states which field combinations are valid. For a bounded buffer, for example, the count must not exceed capacity and the indices must remain within the allocated range. Check these conditions at operation boundaries.", quizQuestion: "What does a representation invariant specify?", quizOptions: ["Conditions that valid internal states must satisfy.", "The exact printed format of every value.", "A requirement that fields never change."], quizAnswerIndex: 0 },
    { title: "Undefined behavior and defensive checks", body: "C defines behavior for valid operations, but some invalid operations have undefined behavior: the language imposes no requirements on the result. Examples include out-of-bounds access and signed integer overflow.\n\nCheck preconditions before performing risky operations, use compiler warnings and sanitizers during development, and avoid assuming that one observed result will be consistent across builds.", quizQuestion: "What is the safest interpretation of undefined behavior?", quizOptions: ["The program cannot rely on any particular result.", "The compiler will always stop with a clear error.", "The operation will behave consistently on every machine."], quizAnswerIndex: 0 },
  ],
  linearAlgebra: [
    { title: "Span, basis, and dimension", body: "The span of a set of vectors contains all linear combinations of those vectors. A basis is a linearly independent set that spans the space. The dimension is the number of vectors in any basis for a finite-dimensional vector space.\n\nA basis gives coordinates for representing every vector in the space. Different bases may describe the same vector with different coordinate lists, while the underlying vector remains unchanged.", quizQuestion: "What two properties define a basis?", quizOptions: ["Linear independence and spanning the space.", "Equal vector lengths and positive entries.", "Orthogonality and integer coordinates in every space."], quizAnswerIndex: 0 },
    { title: "Solving linear systems", body: "A linear system can be written as A x = b. Row operations on the augmented matrix preserve the solution set when they are reversible. Echelon forms reveal pivots, free variables, and whether a system is inconsistent.\n\nA pivot in every variable column gives a unique solution when the system is consistent. Free variables indicate multiple solutions, while a contradictory row indicates none.", quizQuestion: "What does a free variable usually indicate in a consistent linear system?", quizOptions: ["The system has more than one solution.", "The system has no variables.", "The coefficient matrix must be the identity."], quizAnswerIndex: 0 },
    { title: "Eigenvectors and repeated transformations", body: "An eigenvector of a square matrix is a nonzero vector whose direction is unchanged by the transformation; the eigenvalue gives its scale factor. Eigenvectors can reveal directions along which repeated application of a matrix has simple behavior.\n\nNot every matrix has a full basis of eigenvectors, and eigenvalues may be complex even when matrix entries are real. Always check the equation A v = lambda v and require v to be nonzero.", quizQuestion: "What is special about an eigenvector under its matrix transformation?", quizOptions: ["It is scaled without changing direction.", "It is always mapped to the zero vector.", "It must have every coordinate equal to one."], quizAnswerIndex: 0 },
    { title: "Least squares and projections", body: "When A x = b has no exact solution, least squares chooses x to minimize the squared residual norm ||A x - b||². Geometrically, A x is the projection of b onto the column space of A when the relevant conditions hold.\n\nThe normal equations express orthogonality of the residual to the column space. In numerical work, QR factorization is often preferred because forming A-transpose-A can worsen conditioning.", quizQuestion: "What quantity does a least-squares solution minimize?", quizOptions: ["The squared residual between A x and b.", "The number of columns in A.", "The determinant of every possible matrix."], quizAnswerIndex: 0 },
  ],
  circuits: [
    { title: "Kirchhoff's current and voltage laws", body: "Kirchhoff's current law states that charge does not accumulate at an ideal circuit node, so signed currents sum to zero. Kirchhoff's voltage law states that signed voltage changes around a closed loop sum to zero under the circuit model.\n\nChoose reference directions consistently. A negative solved current or voltage indicates that the actual polarity or direction is opposite to the chosen reference, not necessarily that the equations are wrong.", quizQuestion: "What does Kirchhoff's current law express at a node?", quizOptions: ["The signed currents sum to zero.", "Every branch has identical current.", "The node voltage is always zero."], quizAnswerIndex: 0 },
    { title: "Capacitors and transient response", body: "A capacitor stores energy in an electric field and relates charge to voltage through capacitance. Its current depends on how quickly voltage changes, so capacitor voltage cannot change instantaneously under finite current in the ideal model.\n\nIn a first-order RC circuit, the time constant R times C sets the characteristic response timescale. Initial conditions matter because stored energy affects behavior after a switch changes position.", quizQuestion: "What does the RC time constant describe?", quizOptions: ["A characteristic timescale for the circuit's transient response.", "The maximum number of circuit nodes.", "The permanent resistance of an ideal capacitor."], quizAnswerIndex: 0 },
    { title: "Diodes and nonlinear behavior", body: "A diode is a nonlinear component whose current-voltage relationship depends strongly on polarity. Simple circuit analysis often uses an idealized piecewise model: conducting in one direction and blocking in the other, with refinements added for forward voltage and leakage.\n\nBecause the relationship is nonlinear, superposition does not generally apply to circuits containing active nonlinear devices. State the model assumptions before solving.", quizQuestion: "Why does ordinary linear superposition fail for a nonlinear diode model?", quizOptions: ["The current-voltage relationship is not linear.", "The diode has no terminals.", "Superposition applies only to resistors in parallel."], quizAnswerIndex: 0 },
    { title: "Small-signal amplifier intuition", body: "An amplifier uses a powered device to make a small input variation produce a larger output variation. A bias point establishes the operating region; small-signal analysis studies small changes around that point.\n\nAn amplifier's gain is limited by supply rails, bandwidth, and loading. A large theoretical gain does not guarantee a usable output if the signal clips or the circuit cannot drive its load.", quizQuestion: "What does small-signal analysis study?", quizOptions: ["Small changes around an established operating point.", "Only the absolute maximum supply voltage.", "A circuit with no bias conditions."], quizAnswerIndex: 0 },
  ],
  signals: [
    { title: "Sinusoids, period, and frequency", body: "A sinusoid repeats after a period T. Its frequency f is the number of cycles per second, so f = 1/T and is measured in hertz. Angular frequency is 2 pi f radians per second.\n\nA sum of sinusoids can represent richer periodic signals. Amplitude describes scale, while phase describes alignment in time relative to a reference.", quizQuestion: "How are period T and frequency f related?", quizOptions: ["f = 1/T.", "f = T squared.", "They are always equal."], quizAnswerIndex: 0 },
    { title: "Fourier representations", body: "Fourier analysis represents a signal using sinusoidal components. A Fourier series describes periodic signals with harmonically related frequencies; a Fourier transform describes frequency content more generally.\n\nMagnitude indicates the strength of a component and phase indicates its alignment. Frequency-domain views can make filtering and system behavior easier to understand, but the chosen transform conventions must be kept consistent.", quizQuestion: "What does a Fourier representation reveal about a signal?", quizOptions: ["Its component frequencies and their amplitudes and phases.", "Only the signal's average value.", "The source code that generated the signal."], quizAnswerIndex: 0 },
    { title: "Convolution and linear systems", body: "For a linear time-invariant system, the output is the convolution of the input with the system's impulse response. Convolution accumulates contributions from shifted versions of one signal weighted by the other.\n\nThis operation explains why an impulse response characterizes an LTI system. For discrete-time signals, convolution is a sum; for continuous-time signals, it is an integral.", quizQuestion: "How is the output of an LTI system commonly computed from its input?", quizOptions: ["By convolving the input with the impulse response.", "By multiplying the input by its own period.", "By ignoring the system response."], quizAnswerIndex: 0 },
    { title: "Filters and frequency response", body: "A filter changes the relative strength or phase of frequency components. A low-pass filter preserves sufficiently slow variations while attenuating higher frequencies; a high-pass filter does the opposite.\n\nThe cutoff is not usually a perfectly sharp boundary in a physical filter. Evaluate a filter by its passband, stopband, transition region, phase behavior, and response to the signals that matter in the application.", quizQuestion: "What does a low-pass filter generally attenuate?", quizOptions: ["Higher-frequency components.", "All constant components.", "Every frequency equally."], quizAnswerIndex: 0 },
  ],
  control: [
    { title: "Transfer functions and poles", body: "For a linear time-invariant system under suitable assumptions, a transfer function relates the Laplace transform of the output to that of the input. Poles describe natural modes of the system and strongly influence transient behavior and stability.\n\nA transfer function does not capture every physical detail, such as all nonlinear effects or initial conditions. Interpret it within the model and operating range from which it was derived.", quizQuestion: "What do system poles help characterize?", quizOptions: ["Natural modes and aspects of transient behavior and stability.", "The number of physical wires in every implementation.", "Only the input signal's units."], quizAnswerIndex: 0 },
    { title: "Sampling and aliasing", body: "Sampling converts a continuous-time signal into measurements at discrete times. If the sampling rate is too low for the signal's frequency content, different continuous signals can produce the same samples; this is aliasing.\n\nAn anti-aliasing low-pass filter limits high-frequency content before sampling. The required rate depends on the highest frequency that must be represented and on practical filter constraints.", quizQuestion: "What is aliasing?", quizOptions: ["Different continuous signals become indistinguishable after undersampling.", "A signal becomes perfectly noise-free.", "A controller changes its target value."], quizAnswerIndex: 0 },
    { title: "State-space models", body: "A state-space model represents system dynamics through a state vector, an input, and equations describing state evolution and measured output. The state summarizes information needed to predict future behavior given future inputs.\n\nDifferent state choices can model the same input-output behavior. State-space form is especially useful for systems with multiple inputs and outputs and for analyzing internal modes.", quizQuestion: "What is the role of the state vector?", quizOptions: ["It summarizes information needed to predict future system behavior.", "It lists every possible input in the universe.", "It replaces the output equation."], quizAnswerIndex: 0 },
    { title: "Stability and robustness", body: "Stability asks whether system responses remain bounded or converge under specified conditions. Robustness asks whether acceptable behavior persists when the model or environment differs from assumptions.\n\nA controller tuned for one nominal model may perform poorly when parameters vary or sensors are noisy. Analyze margins and test across plausible disturbances rather than relying only on a single ideal simulation.", quizQuestion: "What does robustness concern?", quizOptions: ["How well desired behavior persists under uncertainty and variation.", "Whether a model has a short name.", "Whether a controller uses exactly one parameter."], quizAnswerIndex: 0 },
  ],
  ai: [
    { title: "State-space search strategies", body: "A search problem can be described by an initial state, available actions, a transition model, and a goal test. Search algorithms differ in which frontier state they expand next and what guarantees they provide.\n\nBreadth-first search finds a minimum-edge path when step costs are equal. Uniform-cost search accounts for nonnegative varying costs. Choosing a strategy requires matching assumptions to the problem rather than selecting by name alone.", quizQuestion: "When does breadth-first search find a minimum-edge path?", quizOptions: ["When each step has equal cost.", "When all edge costs are negative.", "Only when the graph has no vertices."], quizAnswerIndex: 0 },
    { title: "Heuristics and admissibility", body: "A heuristic estimates the remaining cost from a state to a goal. In A-star search, the evaluation combines the cost already paid with the estimated remaining cost. An admissible heuristic never overestimates the true minimum remaining cost.\n\nAdmissibility supports optimality under the algorithm's assumptions. A heuristic can still be unhelpful if it is too weak, so quality and correctness guarantees should be considered separately.", quizQuestion: "What property defines an admissible heuristic?", quizOptions: ["It never overestimates the true remaining optimal cost.", "It always gives the exact answer.", "It is larger than every possible path cost."], quizAnswerIndex: 0 },
    { title: "Constraint satisfaction", body: "A constraint-satisfaction problem has variables, domains of possible values, and constraints limiting which combinations are allowed. Backtracking assigns values incrementally and abandons a partial assignment as soon as it violates a constraint.\n\nHeuristics such as choosing the most constrained variable first can reduce search. These heuristics change the order of exploration, not the problem's set of valid solutions.", quizQuestion: "What does backtracking do when a partial assignment violates a constraint?", quizOptions: ["It abandons that branch and tries another assignment.", "It declares every assignment valid.", "It removes the constraints from the problem."], quizAnswerIndex: 0 },
    { title: "Evaluation and data leakage", body: "A predictive model should be evaluated on data that was not used to fit its parameters. A training set supports learning; a validation set can guide model choices; a test set provides a final estimate after those choices are fixed.\n\nData leakage occurs when information unavailable at prediction time influences training or evaluation. Leakage can make reported performance look strong while real-world performance is poor.", quizQuestion: "Why keep a final test set separate from model fitting and tuning?", quizOptions: ["To estimate performance on data not used to make model choices.", "To guarantee the model is unbiased.", "To increase the number of training examples without limit."], quizAnswerIndex: 0 },
  ],
  operatingSystems: [
    { title: "Processes, threads, and scheduling", body: "A process provides an execution environment with resources and an address space. Threads within a process share many resources but have separate execution state such as registers and stacks.\n\nA scheduler chooses which runnable thread receives CPU time. Concurrency allows multiple activities to make progress, while parallelism means work runs at the same instant on different processing units.", quizQuestion: "What is the distinction between concurrency and parallelism?", quizOptions: ["Concurrency is overlapping progress; parallelism is simultaneous execution.", "They are identical terms for storage allocation.", "Parallelism means a program has no threads."], quizAnswerIndex: 0 },
    { title: "Virtual memory and address translation", body: "Virtual memory gives a process an address space that the operating system and hardware map to physical memory. Page tables store translation information, and a translation lookaside buffer caches recent mappings.\n\nIf a needed page is not resident, a page fault lets the operating system fetch or allocate it. Protection bits help prevent one process from accessing memory it is not permitted to use.", quizQuestion: "What does a page table help the system do?", quizOptions: ["Map virtual addresses to physical memory locations and permissions.", "Schedule network packets by priority.", "Compile source code into functions."], quizAnswerIndex: 0 },
    { title: "Synchronization and race conditions", body: "A race condition occurs when a result depends on the unpredictable timing of concurrent operations. A critical section accesses shared state and may need mutual exclusion to prevent conflicting updates.\n\nLocks can protect invariants, but inconsistent lock ordering can deadlock. Keep critical sections small, define ownership clearly, and prefer well-understood synchronization primitives.", quizQuestion: "What is a race condition?", quizOptions: ["A timing-dependent result caused by interacting concurrent operations.", "A deterministic result from a single-threaded function.", "A method for translating virtual addresses."], quizAnswerIndex: 0 },
    { title: "System calls and protection boundaries", body: "A system call requests a service from the operating system, such as reading a file or creating a process. The transition enters a privileged kernel context, which validates arguments and mediates access to protected resources.\n\nThis boundary supports isolation, but system calls have costs and can fail. Applications should check return values and handle errors rather than assuming every request succeeds.", quizQuestion: "Why does an application use a system call?", quizOptions: ["To request an operating-system service across a protection boundary.", "To bypass all operating-system checks.", "To guarantee a request cannot fail."], quizAnswerIndex: 0 },
  ],
};

const lessonPackByCourse: Record<string, keyof typeof courseLessonPacks> = {
  "harvard-cs50x-2026": "algorithms",
  "stanford-cs106a": "programming",
  "stanford-cs106b": "algorithms",
  "mit-6-006-algorithms": "algorithms",
  "mit-6-046j-algorithms": "algorithms",
  "mit-6-042j-math-computer-science": "discrete",
  "mit-6-005-software-construction": "software",
  "mit-6-004-computation-structures": "architecture",
  "mit-6-041sc-probability": "probability",
  "mit-6-02-digital-communication": "communications",
  "mit-6-087-c-programming": "cProgramming",
  "mit-6-189-python": "programming",
  "mit-18-06sc-linear-algebra": "linearAlgebra",
  "mit-6-002-circuits-electronics": "circuits",
  "mit-6-003-signals-systems": "signals",
  "mit-6-011-communication-control-signal-processing": "control",
  "mit-6-034-artificial-intelligence": "ai",
  "mit-6-045j-automata-computability": "discrete",
  "mit-6-828-operating-system-engineering": "operatingSystems",
  "mit-6-170-software-engineering": "software",
};

const MIN_LESSONS_PER_COURSE = 5;

function ensureMinimumLessons(packName: string, lessons: LessonContent[]): LessonContent[] {
  const enriched = [...lessons];
  while (enriched.length < MIN_LESSONS_PER_COURSE) {
    enriched.push({
      title: `${packName.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} roadmap checkpoint`,
      body: "This LearnFlow checkpoint turns the core ideas from the course into a structured study rhythm. Review the key concept, connect it to the official course material, complete a short practice prompt, and then identify the next topic to strengthen before moving on. A good study plan reinforces knowledge in small loops, not one giant pass.\n\nTreat each lesson as a milestone: understand the concept, test it on a small example, and build toward a broader project or assignment. A recurring roadmap makes it easier to keep momentum across a semester and revisit weak spots without losing your place.",
      quizQuestion: "What is the goal of a course roadmap checkpoint?",
      quizOptions: ["To reinforce core ideas and show the next study step.", "To remove all practice from the course.", "To skip the official course material."],
      quizAnswerIndex: 0,
    });
  }
  return enriched;
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const course of courses) {
      await client.query(
        `INSERT INTO courses
          (slug, title, summary, subject, level, provider, source_url, license_name, license_url,
           attribution, details, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, TRUE)
         ON CONFLICT (slug) DO UPDATE SET
           details = EXCLUDED.details,
           is_published = EXCLUDED.is_published`,
        [
          course.slug,
          course.title,
          course.summary,
          course.subject,
          course.level,
          course.provider,
          course.sourceUrl,
          course.licenseName,
          course.licenseUrl,
          course.attribution,
          JSON.stringify(courseDetailsBySlug[course.slug] ?? {}),
        ],
      );
    }

    for (const course of legacyUniversityCourses) {
      await client.query(
        `INSERT INTO courses
          (slug, title, summary, subject, level, provider, source_url, license_name, license_url,
           attribution, details, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '{}'::jsonb, TRUE)
         ON CONFLICT (slug) DO UPDATE SET
           details = EXCLUDED.details,
           is_published = EXCLUDED.is_published,
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           subject = EXCLUDED.subject,
           level = EXCLUDED.level,
           provider = EXCLUDED.provider,
           source_url = EXCLUDED.source_url,
           license_name = EXCLUDED.license_name,
           license_url = EXCLUDED.license_url,
           attribution = EXCLUDED.attribution`,
        [
          course.slug,
          course.title,
          course.summary,
          course.subject,
          course.level,
          course.provider,
          course.sourceUrl,
          course.licenseName,
          course.licenseUrl,
          course.attribution,
        ],
      );
    }

    const legacyCourseIds = await client.query<{ id: string; slug: string }>(
      "SELECT id, slug FROM courses WHERE slug = ANY($1::text[])",
      [legacyUniversityCourses.map((course) => course.slug)],
    );
    for (const row of legacyCourseIds.rows) {
      const course = legacyUniversityCourses.find((item) => item.slug === row.slug);
      if (!course) continue;
      const legacyLessons = [
        ["Course foundations", "Start by defining the purpose, scope, and key terminology of the course. Use examples to connect each new term to a practical problem in the field."],
        ["Core concepts and models", "Break the subject into its central concepts, inputs, processes, outputs, and constraints. Compare how those ideas appear in simple and realistic scenarios."],
        ["Problem solving practice", "Solve a representative problem in small steps: identify the known information, choose a method, execute it carefully, and verify the result."],
        ["Application and analysis", "Apply the course concepts to a new situation. Explain your assumptions, evaluate alternatives, and support your conclusion with evidence."],
        ["Review and integrated project", "Review the course themes and produce a short written summary or practical project that connects the foundational ideas to the techniques studied."],
      ] as const;

      for (const [index, [title, body]] of legacyLessons.entries()) {
        await client.query(
          `INSERT INTO lessons
            (course_id, title, body, position, quiz_question, quiz_options, quiz_answer_index)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
           ON CONFLICT (course_id, position) DO NOTHING`,
          [
            row.id,
            `${course.title}: ${title}`,
            `${body}\n\nStudy task: Read the relevant chapter or lecture notes supplied by Legacy University Okija, summarize one key idea in your own words, and test your understanding before continuing.`,
            index + 1,
            `Which study step best demonstrates understanding in ${course.title}?`,
            JSON.stringify(["Explain the idea and apply it to a new example.", "Copy a definition without checking it.", "Skip examples and assume the topic is understood."]),
            0,
          ],
        );
      }

      const resources = [
        ["assignment", "Course study assignment", "Complete a short written assignment: define three key course concepts, solve one representative problem, and explain each step.", 1],
        ["lecture_notes", "Course notes checklist", "Use the checklist as a guide when reviewing lecturer-provided notes, readings, or lesson recordings.", 2],
        ["other", "Legacy University course source", "Open the university website to locate the current syllabus and lecturer-provided materials for this course.", 3],
      ] as const;
      for (const [resourceType, title, description, position] of resources) {
        await client.query(
          `INSERT INTO course_resources
            (course_id, resource_type, title, description, license_name, attribution, url, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (course_id, position) DO NOTHING`,
          [
            row.id,
            resourceType,
            title,
            description,
            "University course materials; permissions vary",
            "Legacy University Okija, Department of Computer Science. Confirm permission and attribution before reuse.",
            course.sourceUrl,
            position,
          ],
        );
      }
    }

    const courseIds = await client.query<{ id: string; slug: string }>(
      "SELECT id, slug FROM courses WHERE slug = ANY($1::text[])",
      [courses.map((course) => course.slug)],
    );
    const idsBySlug = new Map(courseIds.rows.map((row) => [row.slug, row.id]));

    const legacySeedLessonTitles = new Set([
      ...starterLessons.map((lesson) => lesson.title),
      ...Object.entries(lessonPackByCourse).flatMap(([courseSlug, packName]) => {
        const pack = courseLessonPacks[packName];
        if (!pack) throw new Error(`Unable to find lesson pack "${packName}" for "${courseSlug}".`);
        return ensureMinimumLessons(packName, pack).map((lesson) => lesson.title);
      }),
    ]);

    for (const course of courses) {
      const courseId = idsBySlug.get(course.slug);
      if (!courseId) throw new Error(`Unable to find seeded course "${course.slug}".`);
      const topics = courseStudyGuides[course.slug];
      if (!topics || topics.length !== 20) {
        throw new Error(`Course "${course.slug}" must have exactly 20 original study topics.`);
      }

      for (const [index, [title, keyIdea]] of topics.entries()) {
        const position = index + 1;
        const correctAnswerIndex = position % 3;
        const quizOptions = [
          "Apply the same procedure without checking assumptions, inputs, or boundary cases.",
          "Treat one successful example as proof that the method works for every possible case.",
        ];
        quizOptions.splice(correctAnswerIndex, 0, keyIdea);
        const body = [
          `Core idea: ${keyIdea}`,
          `Study it actively: For ${title}, work through an example from scratch, write down the assumptions, and explain why the result follows. Use the official course page for the complete lectures, readings, worked examples, and assignments; this original LearnFlow guide is a study aid, not a replacement for the provider's full materials.`,
        ].join("\n\n");

        await client.query(
          `INSERT INTO lessons
            (course_id, title, body, position, quiz_question, quiz_options, quiz_answer_index)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
           ON CONFLICT (course_id, position) DO UPDATE SET
             title = EXCLUDED.title,
             body = EXCLUDED.body,
             quiz_question = EXCLUDED.quiz_question,
             quiz_options = EXCLUDED.quiz_options,
             quiz_answer_index = EXCLUDED.quiz_answer_index
             WHERE lessons.title = ANY($8::text[])
               AND lessons.body NOT LIKE 'Core idea: %'`,
          [
            courseId,
            title,
            body,
            position,
            `Which statement best captures the core idea of ${title}?`,
            JSON.stringify(quizOptions),
            correctAnswerIndex,
            [...legacySeedLessonTitles],
          ],
        );
      }
    }

    await client.query("COMMIT");
    console.info("Course catalog seed completed.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error: unknown) => {
  console.error("Course seed failed.", error);
  process.exitCode = 1;
});
