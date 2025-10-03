import mongoose from "mongoose";
import Question from "@/models/Question";
import User from "@/models/User";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function seedQuestion() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find a teacher (use the first one)
    const teacher = await User.findOne({ role: "teacher" });
    if (!teacher) {
      console.error("No teacher found! Please create a teacher account first.");
      process.exit(1);
    }

    console.log(`Creating question for teacher: ${teacher.email}`);

    const question = await Question.create({
      teacherId: teacher._id,
      title: "Pharmacological basis of ACE Inhibitors in HFrEF",
      description: "Answer the following question about ACE Inhibitors in Heart Failure with reduced Ejection Fraction (HFrEF)",
      rubric: {
        totalMarks: 100,
        sections: [
          {
            name: "Mechanism of Action of ACE Inhibitors",
            totalMarks: 40,
            criteria: [
              {
                description: "Inhibition of angiotensin-converting enzyme (ACE) - Clear explanation of how ACE inhibitors block the enzyme ACE and understanding of the location and function of ACE in the RAAS",
                marks: 10,
                guidance: "Look for clear explanation of enzyme blockage (5 marks) and RAAS understanding (5 marks)"
              },
              {
                description: "Reduction in the conversion of angiotensin I to angiotensin II - Description of conversion process and significance of reducing angiotensin II levels",
                marks: 10,
                guidance: "Must describe conversion process (5 marks) and significance (5 marks)"
              },
              {
                description: "Decrease in aldosterone secretion - Mechanism and implications on sodium and water retention",
                marks: 10,
                guidance: "Mechanism explanation (5 marks) and implications (5 marks)"
              },
              {
                description: "Reduction in degradation of bradykinin and its implications - Role of ACE in bradykinin degradation and effects including vasodilation and side effects",
                marks: 10,
                guidance: "Role of ACE (5 marks) and effects of increased bradykinin (5 marks)"
              }
            ]
          },
          {
            name: "Effects on Heart and Aldosterone",
            totalMarks: 20,
            criteria: [
              {
                description: "Decrease in blood volume due to reduced aldosterone levels",
                marks: 5,
                guidance: "Clear explanation of mechanism"
              },
              {
                description: "Improvement in cardiac output and symptoms of heart failure",
                marks: 10,
                guidance: "Mechanism (5 marks) and clinical outcomes (5 marks)"
              },
              {
                description: "Reduction in sodium and water retention",
                marks: 5,
                guidance: "Direct effects on renal handling"
              }
            ]
          },
          {
            name: "Direct Effects of Angiotensin II on Vessels and Heart",
            totalMarks: 20,
            criteria: [
              {
                description: "Vasodilation due to reduced angiotensin II levels - Explanation and impact on afterload/cardiac workload",
                marks: 10,
                guidance: "Vasodilation explanation (5 marks) and impact (5 marks)"
              },
              {
                description: "Decrease in vasoconstriction and peripheral resistance - Relationship and consequences",
                marks: 10,
                guidance: "Understanding relationship (5 marks) and consequences (5 marks)"
              }
            ]
          },
          {
            name: "Remodeling Effects",
            totalMarks: 20,
            criteria: [
              {
                description: "Inhibition of myocardial and vascular remodeling - Definition and mechanism",
                marks: 10,
                guidance: "Definition (5 marks) and mechanism (5 marks)"
              },
              {
                description: "Prevention of hypertrophy and fibrosis",
                marks: 5,
                guidance: "Explanation (2.5 marks) and role of ACE inhibitors (2.5 marks)"
              },
              {
                description: "Long-term benefits on morbidity and mortality in HFrEF",
                marks: 5,
                guidance: "Clinical evidence presentation"
              }
            ]
          }
        ],
        gradingInstructions: "Grade strictly according to the rubric. Award partial marks for incomplete but correct answers. Look for medical accuracy, clear explanations, and understanding of mechanisms. Students must demonstrate understanding of the RAAS system, hemodynamic effects, and clinical implications."
      },
      settings: {
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        allowLateSubmissions: true,
        maxAttempts: 1,
        requireTeacherReview: true,
      }
    });

    console.log("✅ Question created successfully!");
    console.log("Question ID:", question._id);
    console.log("Title:", question.title);
    console.log("Total Marks:", question.rubric.totalMarks);
    console.log("\nShare this submission link with students:");
    console.log(`http://localhost:3000/submit/${question._id}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding question:", error);
    process.exit(1);
  }
}

seedQuestion();