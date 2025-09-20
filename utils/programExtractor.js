/**
 * Program Extraction Utility
 * 
 * This utility extracts degree programs, courses, and fields of study from text content.
 * It can be used across all scrapers to identify academic programs mentioned in scholarship descriptions.
 */

/**
 * Extracts programs/degrees from text content
 * @param {string} text - The text content to extract programs from
 * @param {Object} options - Configuration options
 * @param {number} options.maxPrograms - Maximum number of programs to return (default: 10)
 * @param {boolean} options.caseSensitive - Whether to preserve case (default: false)
 * @param {Array<string>} options.excludeWords - Words to exclude from program names
 * @returns {Array<string>} Array of extracted programs
 */
const extractPrograms = (text, options = {}) => {
    const {
        maxPrograms = 10,
        caseSensitive = false,
        excludeWords = ['degree', 'program', 'course', 'studies', 'major', 'minor', 'scholarship']
    } = options;

    if (!text || typeof text !== 'string') {
        return [];
    }

    const programs = new Set();
    
    // Common degree programs and fields of study patterns
    const programPatterns = [
        // Engineering programs
        /\b(computer engineering|software engineering|civil engineering|mechanical engineering|electrical engineering|chemical engineering|industrial engineering|aerospace engineering|biomedical engineering|environmental engineering)\b/gi,
        
        // Computer Science and IT
        /\b(computer science|information technology|information systems|cybersecurity|data science|artificial intelligence|machine learning|software development|web development|mobile development)\b/gi,
        
        // Business and Management
        /\b(business administration|business management|accounting|finance|marketing|human resources|entrepreneurship|economics|international business|supply chain management)\b/gi,
        
        // Medicine and Health
        /\b(medicine|nursing|pharmacy|physical therapy|occupational therapy|medical technology|radiology|dentistry|veterinary medicine|public health|healthcare management)\b/gi,
        
        // Education
        /\b(curriculum development|educational psychology)\b/gi,
        
    // Arts and Humanities
    /\b(english|literature|history|philosophy|psychology|sociology|political science|international relations|communication|journalism|mass communication|humanities|culture|arts|visual arts|music|theater|film studies|languages)\b/gi,
        
        // Science and Mathematics
        /\b(mathematics|physics|chemistry|biology|environmental science|geology|astronomy|statistics|applied mathematics|biochemistry|biotechnology)\b/gi,
        
        // Agriculture and Environment
        /\b(agriculture|agricultural engineering|forestry|environmental studies|sustainable development|food science|animal science|crop science)\b/gi,
        
        // Architecture and Design
        /\b(architecture|interior design|graphic design|fashion design|industrial design|urban planning|landscape architecture)\b/gi,
        
        // Law and Legal Studies
        /\b(law|legal studies|criminology|criminal justice|political science|public administration)\b/gi,
        
        // Social Work and Psychology
        /\b(social work|psychology|counseling|social services|community development)\b/gi,
        
        
        // Specific course mentions
        /\b(bs|ba|ma|ms|mba|md|phd|dmd|dvm|rn|bsc|bcom|btech|mtech|mcom|msc)\b/gi
    ];
    
    // Extract programs using patterns
    programPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                // Clean and normalize the program name
                let cleanProgram = match.trim();
                
                if (!caseSensitive) {
                    cleanProgram = cleanProgram.toLowerCase();
                }
                
                // Remove excluded words
                const excludeRegex = new RegExp(`\\b(${excludeWords.join('|')})\\b`, 'gi');
                cleanProgram = cleanProgram.replace(excludeRegex, '');
                
                // Normalize whitespace
                cleanProgram = cleanProgram.replace(/\s+/g, ' ').trim();
                
                if (cleanProgram && cleanProgram.length > 2) {
                    programs.add(cleanProgram);
                }
            });
        }
    });
    
    // Look for specific program mentions in common phrases
    const specificPhrases = [
        /(?:for|in|studying|pursuing|enrolled in)\s+([a-z\s]+(?:engineering|science|arts|business|medicine|education|law|agriculture|architecture|technology))/gi,
        /(?:bachelor'?s|master'?s|doctorate|phd)\s+(?:in|of)\s+([a-z\s]+)/gi
    ];
    
    specificPhrases.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const programMatch = match.match(/(?:for|in|studying|pursuing|enrolled in|bachelor'?s|master'?s|doctorate|phd)\s+(?:in|of)?\s*([a-z\s]+)/i);
                if (programMatch && programMatch[1]) {
                    let cleanProgram = programMatch[1].trim();
                    
                    if (!caseSensitive) {
                        cleanProgram = cleanProgram.toLowerCase();
                    }
                    
                    // Remove excluded words
                    const excludeRegex = new RegExp(`\\b(${excludeWords.join('|')})\\b`, 'gi');
                    cleanProgram = cleanProgram.replace(excludeRegex, '');
                    
                    // Normalize whitespace
                    cleanProgram = cleanProgram.replace(/\s+/g, ' ').trim();
                    
                    if (cleanProgram && cleanProgram.length > 2) {
                        programs.add(cleanProgram);
                    }
                }
            });
        }
    });
    
    return Array.from(programs).slice(0, maxPrograms);
};

/**
 * Extracts programs from multiple text fields and combines them
 * @param {Object} fields - Object containing text fields to extract from
 * @param {string} fields.name - Scholarship name
 * @param {string} fields.description - Scholarship description
 * @param {Array<string>} fields.benefits - Array of benefits
 * @param {Array<string>} fields.eligibility - Array of eligibility criteria
 * @param {Array<string>} fields.requirements - Array of requirements
 * @param {Object} options - Configuration options for extractPrograms
 * @returns {Array<string>} Array of extracted programs
 */
const extractProgramsFromFields = (fields, options = {}) => {
    const {
        name = '',
        description = '',
        benefits = [],
        eligibility = [],
        requirements = []
    } = fields;

    const categories = new Set();
    let hasClearMatch = false;

    // First, check the title/name directly for program keywords with high priority
    const titleCategories = getProgramCategories(name);
    if (titleCategories.length > 0) {
        hasClearMatch = true;
        titleCategories.forEach(category => categories.add(category));
    }

    // If no match in title, then check all text content
    if (!hasClearMatch) {
        // Combine all text content, giving extra weight to the name/title
    const allText = [
            name + ' ' + name, // Include title twice for higher priority
        description,
        Array.isArray(benefits) ? benefits.join(' ') : benefits,
        Array.isArray(eligibility) ? eligibility.join(' ') : eligibility,
        Array.isArray(requirements) ? requirements.join(' ') : requirements
    ].join(' ');

        // Extract raw programs from combined text
        const rawPrograms = extractPrograms(allText, options);
        
        // Convert to clean academic categories with strict matching
        rawPrograms.forEach(program => {
            const programCategories = getProgramCategories(program);
            if (programCategories.length > 0) {
                hasClearMatch = true;
                programCategories.forEach(category => categories.add(category));
            }
        });
    }
    
    // If no clear program match found, return General
    if (!hasClearMatch || categories.size === 0) {
        return ['General'];
    }
    
    return Array.from(categories);
};

/**
 * Validates if a program name is meaningful
 * @param {string} program - Program name to validate
 * @returns {boolean} True if program is meaningful
 */
const isValidProgram = (program) => {
    if (!program || typeof program !== 'string') return false;
    
    const trimmed = program.trim();
    if (trimmed.length < 3) return false;
    
    // Exclude common non-program words
    const excludePatterns = [
        /^(and|or|the|a|an|in|on|at|to|for|of|with|by)$/i,
        /^(scholarship|grant|aid|funding|financial|assistance)$/i,
        /^(student|applicant|candidate|recipient)$/i,
        /^(must|should|required|eligible|qualified)$/i
    ];
    
    return !excludePatterns.some(pattern => pattern.test(trimmed));
};

/**
 * Comprehensive list of specific degree programs and course codes with their categories
 */
const PROGRAM_CATEGORIES = {
    // Computer Science & IT Programs
    'BS Computer Science': 'Computer Science',
    'BS Information Technology': 'Computer Science',
    'BS Information Systems': 'Computer Science',
    'BS Cybersecurity': 'Computer Science',
    'BS Data Science': 'Computer Science',
    'BS Software Engineering': 'Computer Science',
    'BS Computer Engineering': 'Computer Science',
    'BS Computer Programming': 'Computer Science',
    'BS Database Administration': 'Computer Science',
    'BS Network Administration': 'Computer Science',
    'BS IT Management': 'Computer Science',
    'BSCS': 'Computer Science',
    'BSIT': 'Computer Science',
    'BSCpE': 'Computer Science',
    'BSCE': 'Computer Science',
    
    // Engineering Programs
    'BS Mechanical Engineering': 'Engineering',
    'BS Electrical Engineering': 'Engineering',
    'BS Civil Engineering': 'Engineering',
    'BS Chemical Engineering': 'Engineering',
    'BS Industrial Engineering': 'Engineering',
    'BS Aerospace Engineering': 'Engineering',
    'BS Biomedical Engineering': 'Engineering',
    'BS Environmental Engineering': 'Engineering',
    'BS Agricultural Engineering': 'Engineering',
    'BS Petroleum Engineering': 'Engineering',
    'BS Materials Engineering': 'Engineering',
    'BS Nuclear Engineering': 'Engineering',
    'BS Marine Engineering': 'Engineering',
    'BSME': 'Engineering',
    'BSEE': 'Engineering',
    'BSCE': 'Engineering',
    'BSChE': 'Engineering',
    'BSIE': 'Engineering',
    'BSCpE': 'Engineering',
    
    // Business & Management Programs
    'BS Business Administration': 'Business',
    'BS Business Management': 'Business',
    'BS Accounting': 'Business',
    'BS Finance': 'Business',
    'BS Marketing': 'Business',
    'BS Human Resources': 'Business',
    'BS Entrepreneurship': 'Business',
    'BS Economics': 'Business',
    'BS International Business': 'Business',
    'BS Supply Chain Management': 'Business',
    'BS Operations Management': 'Business',
    'BS Project Management': 'Business',
    'BS Public Administration': 'Business',
    'BS Hospitality Management': 'Business',
    'BS Tourism Management': 'Business',
    'BSBA': 'Business',
    'BSA': 'Business',
    'BSE': 'Business',
    'BSPA': 'Business',
    'BSTM': 'Business',
    'BSHM': 'Business',
    'BBA': 'Business',
    'MBA': 'Business',
    
    // Medicine & Health Programs
    'Doctor of Medicine': 'Medicine',
    'BS Nursing': 'Medicine',
    'BS Pharmacy': 'Medicine',
    'BS Physical Therapy': 'Medicine',
    'BS Occupational Therapy': 'Medicine',
    'BS Medical Technology': 'Medicine',
    'BS Radiology': 'Medicine',
    'Doctor of Dental Medicine': 'Medicine',
    'Doctor of Veterinary Medicine': 'Medicine',
    'BS Public Health': 'Medicine',
    'BS Healthcare Management': 'Medicine',
    'BS Nutrition': 'Medicine',
    'BS Psychology': 'Medicine',
    'BS Mental Health': 'Medicine',
    'BS Health Sciences': 'Medicine',
    'BSN': 'Medicine',
    'BSPT': 'Medicine',
    'BSOT': 'Medicine',
    'BSMT': 'Medicine',
    'DVM': 'Medicine',
    'MD': 'Medicine',
    'DMD': 'Medicine',
    
    // Education Programs
    'Bachelor of Elementary Education': 'Education',
    'Bachelor of Secondary Education': 'Education',
    'BS Elementary Education': 'Education',
    'BS Secondary Education': 'Education',
    'BS Special Education': 'Education',
    'BS Educational Leadership': 'Education',
    'BS Curriculum Development': 'Education',
    'BS Educational Psychology': 'Education',
    'BS Early Childhood Education': 'Education',
    'BS Adult Education': 'Education',
    'BS Educational Technology': 'Education',
    'BEED': 'Education',
    'BSED': 'Education',
    'BEEd': 'Education',
    'BS Ed': 'Education',
    'MA Education': 'Education',
    'MA Teaching': 'Education',
    'MEd': 'Education',
    'PhD Education': 'Education',
    
    // Arts & Humanities Programs
    'BA English': 'Arts & Humanities',
    'BA Literature': 'Arts & Humanities',
    'BA History': 'Arts & Humanities',
    'BA Philosophy': 'Arts & Humanities',
    'BA Sociology': 'Arts & Humanities',
    'BA Political Science': 'Arts & Humanities',
    'BA International Relations': 'Arts & Humanities',
    'BA Communication': 'Arts & Humanities',
    'BA Journalism': 'Arts & Humanities',
    'BA Mass Communication': 'Arts & Humanities',
    'BA Fine Arts': 'Arts & Humanities',
    'BA Music': 'Arts & Humanities',
    'BA Theater': 'Arts & Humanities',
    'BA Film Studies': 'Arts & Humanities',
    'BA Languages': 'Arts & Humanities',
    'AB English': 'Arts & Humanities',
    'AB History': 'Arts & Humanities',
    'AB Philosophy': 'Arts & Humanities',
    'AB Political Science': 'Arts & Humanities',
    'AB Communication': 'Arts & Humanities',
    'AB Journalism': 'Arts & Humanities',
    'AB Mass Communication': 'Arts & Humanities',
    'AB': 'Arts & Humanities',
    'BA': 'Arts & Humanities',
    'Arts and Culture': 'Arts & Humanities',
    'Artistic': 'Arts & Humanities',
    'Performing Arts': 'Arts & Humanities',
    'Visual arts': 'Arts & Humanities',
    'Humanities': 'Arts & Humanities',
    'Culture': 'Arts & Humanities',
    'Arts': 'Arts & Humanities',
    'Visual Arts': 'Arts & Humanities',
    'Music': 'Arts & Humanities',
    'Theater': 'Arts & Humanities',
    'Film Studies': 'Arts & Humanities',
    'Languages': 'Arts & Humanities',

    
    // Science Programs
    'BS Mathematics': 'Science',
    'BS Physics': 'Science',
    'BS Chemistry': 'Science',
    'BS Biology': 'Science',
    'BS Environmental Science': 'Science',
    'BS Geology': 'Science',
    'BS Astronomy': 'Science',
    'BS Statistics': 'Science',
    'BS Applied Mathematics': 'Science',
    'BS Biochemistry': 'Science',
    'BS Biotechnology': 'Science',
    'BS Marine Biology': 'Science',
    'BS Microbiology': 'Science',
    'BS Zoology': 'Science',
    'BS Botany': 'Science',
    'BSC': 'Science',
    'BS Math': 'Science',
    'BS Physics': 'Science',
    'BS Chemistry': 'Science',
    'BS Biology': 'Science',
    'BSC': 'Science',
    
    // Agriculture Programs
    'BS Agriculture': 'Agriculture',
    'BS Agricultural Engineering': 'Agriculture',
    'BS Forestry': 'Agriculture',
    'BS Environmental Studies': 'Agriculture',
    'BS Sustainable Development': 'Agriculture',
    'BS Food Science': 'Agriculture',
    'BS Animal Science': 'Agriculture',
    'BS Crop Science': 'Agriculture',
    'BS Agricultural Economics': 'Agriculture',
    'BS Soil Science': 'Agriculture',
    'BS Horticulture': 'Agriculture',
    'BSA': 'Agriculture',
    'BS Ag': 'Agriculture',
    'BS Forestry': 'Agriculture',
    
    // Architecture & Design Programs
    'BS Architecture': 'Architecture & Design',
    'BS Interior Design': 'Architecture & Design',
    'BS Graphic Design': 'Architecture & Design',
    'BS Fashion Design': 'Architecture & Design',
    'BS Industrial Design': 'Architecture & Design',
    'BS Urban Planning': 'Architecture & Design',
    'BS Landscape Architecture': 'Architecture & Design',
    'BS Product Design': 'Architecture & Design',
    'BS Digital Design': 'Architecture & Design',
    
    // Law & Legal Programs
    'Bachelor of Laws': 'Law',
    'BS Legal Studies': 'Law',
    'BS Criminology': 'Law',
    'BS Criminal Justice': 'Law',
    'BS Paralegal Studies': 'Law',
    'BS Forensic Science': 'Law',
    'LLB': 'Law',
    'JD': 'Law',
    'BSCrim': 'Law',
    'BSCJ': 'Law',
    
    // Social Work Programs
    'BS Social Work': 'Social Work',
    'BS Social Services': 'Social Work',
    'BS Community Development': 'Social Work',
    'BS Counseling': 'Social Work',
    'BS Social Psychology': 'Social Work',
    'BS Human Services': 'Social Work',
    'BSW': 'Social Work',
    'BSSW': 'Social Work',
    
};

/**
 * Gets program categories for a given program with case-insensitive matching
 * @param {string} program - Program name
 * @returns {Array<string>} Array of categories the program belongs to
 */
const getProgramCategories = (program) => {
    const lowerProgram = program.toLowerCase().trim();
    
    // Check for exact matches in the program list (case-insensitive)
    for (const [programName, category] of Object.entries(PROGRAM_CATEGORIES)) {
        if (lowerProgram === programName.toLowerCase()) {
            return [category];
        }
    }
    
    // Check for partial matches with word boundaries (case-insensitive)
    for (const [programName, category] of Object.entries(PROGRAM_CATEGORIES)) {
        const regex = new RegExp(`\\b${programName.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerProgram)) {
            return [category];
        }
    }
    
    // Check for case-insensitive substring matches for broader coverage
    for (const [programName, category] of Object.entries(PROGRAM_CATEGORIES)) {
        if (lowerProgram.includes(programName.toLowerCase()) || programName.toLowerCase().includes(lowerProgram)) {
            return [category];
        }
    }
    
    // No match found
    return [];
};

export {
    extractPrograms,
    extractProgramsFromFields,
    isValidProgram,
    getProgramCategories
};

export default extractPrograms;
