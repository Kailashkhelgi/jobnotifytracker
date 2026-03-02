const generateJobs = () => {
    const companies = ["Infosys", "TCS", "Wipro", "Accenture", "Capgemini", "Cognizant", "IBM", "Oracle", "SAP", "Dell", "Amazon", "Flipkart", "Swiggy", "Razorpay", "PhonePe", "Paytm", "Zoho", "Freshworks", "Juspay", "CRED", "Zerodha", "Groww", "Postman", "Dunzo", "Unacademy"];
    const roles = ["SDE Intern", "Graduate Engineer Trainee", "Junior Backend Developer", "Frontend Intern", "QA Intern", "Data Analyst Intern", "Java Developer", "Python Developer", "React Developer", "Full Stack Engineer", "DevOps Trainee", "Data Scientist"];
    const locations = ["Bangalore", "Hyderabad", "Pune", "Chennai", "Mumbai", "Delhi NCR", "Remote"];
    const modes = ["Remote", "Hybrid", "Onsite"];
    const experiences = ["Fresher", "0-1", "1-3", "3-5"];
    const sources = ["LinkedIn", "Naukri", "Indeed", "Wellfound"];
    const salaries = ["3–5 LPA", "6–10 LPA", "10–18 LPA", "15–25 LPA", "₹15k–₹40k/month Internship", "₹40k–₹80k/month Internship"];
    const skillSets = [
        ["Java", "Spring Boot", "MySQL", "AWS"],
        ["React", "JavaScript", "HTML/CSS", "Redux"],
        ["Python", "Django", "PostgreSQL", "Docker"],
        ["Node.js", "Express", "MongoDB", "REST APIs"],
        ["C++", "Data Structures", "Algorithms", "Linux"],
        ["Python", "Pandas", "SQL", "Tableau"],
        ["AWS", "Kubernetes", "CI/CD", "Terraform"],
        ["Selenium", "Java", "TestNG", "JIRA"]
    ];

    const generateDescription = (role, company) => {
        return `As a ${role} at ${company}, you will be part of a dynamic team building scalable solutions for millions of users. 
You will collaborate with cross-functional teams to design, develop, and maintain high-quality software. 
We are looking for passionate individuals with a strong foundation in modern technologies and problem-solving skills. 
You will have the opportunity to learn, grow, and make a significant impact from day one.`;
    };

    const jobs = [];
    for (let i = 1; i <= 60; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)];
        const role = roles[Math.floor(Math.random() * roles.length)];
        const isInternship = role.includes("Intern") || role.includes("Trainee");
        const exp = isInternship ? "Fresher" : experiences[Math.floor(Math.random() * experiences.length)];
        let salaryRange = salaries[Math.floor(Math.random() * (salaries.length - 2))];
        if (isInternship) {
            salaryRange = salaries[4 + Math.floor(Math.random() * 2)];
        }

        jobs.push({
            id: `job-${1000 + i}`,
            title: role,
            company: company,
            location: locations[Math.floor(Math.random() * locations.length)],
            mode: modes[Math.floor(Math.random() * modes.length)],
            experience: exp,
            skills: skillSets[Math.floor(Math.random() * skillSets.length)],
            source: sources[Math.floor(Math.random() * sources.length)],
            postedDaysAgo: Math.floor(Math.random() * 11), // 0-10
            salaryRange: salaryRange,
            applyUrl: `https://example.com/apply/${company.toLowerCase()}-${i}`,
            description: generateDescription(role, company)
        });
    }

    // Sort by latest by default
    return jobs.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
};

const jobData = generateJobs();
