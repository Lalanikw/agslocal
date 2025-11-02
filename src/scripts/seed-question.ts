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
      title: "Pharmacological Basis of ACE Inhibitors in Heart Failure with Reduced Ejection Fraction (HFrEF)",
      description: "Explain the pharmacological basis for using ACE inhibitors in the treatment of Heart Failure with Reduced Ejection Fraction (HFrEF). Your answer should cover four main areas: 1. Mechanism of Action of ACE Inhibitors, 2. Effects on Heart and Aldosterone, 3. Direct Effects of Angiotensin II on Vessels and Heart, 4. Remodeling Effects",
      rubric: {
        totalMarks: 100,
        sections: [],
        gradingInstructions: `MARKING SCHEME FOR ACE INHIBITORS IN HFrEF (Total: 100 marks)

1. Mechanism of Action of ACE Inhibitors (40 marks)

   a) Inhibition of angiotensin-converting enzyme (ACE) (10 marks)
      - Clear explanation of how ACE inhibitors block the enzyme ACE (5 marks)
      - Understanding of the location and function of ACE in the renin-angiotensin-aldosterone system (5 marks)

   b) Reduction in the conversion of angiotensin I to angiotensin II (10 marks)
      - Description of the conversion process from angiotensin I to angiotensin II (5 marks)
      - Explanation of the significance of reducing angiotensin II levels (5 marks)

   c) Decrease in aldosterone secretion (10 marks)
      - Mechanism by which reduced angiotensin II levels lead to decreased aldosterone secretion (5 marks)
      - Implications of decreased aldosterone on sodium and water retention (5 marks)

   d) Reduction in degradation of bradykinin and its implications (10 marks)
      - Role of ACE in bradykinin degradation (5 marks)
      - Effects of increased bradykinin levels, including vasodilation and potential side effects (5 marks)

2. Effects on Heart and Aldosterone (20 marks)

   a) Decrease in blood volume due to reduced aldosterone levels (5 marks)
      - Explanation of how reduced aldosterone levels decrease blood volume (5 marks)

   b) Improvement in cardiac output and symptoms of heart failure (10 marks)
      - Mechanism by which ACE inhibitors improve cardiac output (5 marks)
      - Clinical outcomes observed in heart failure symptoms (5 marks)

   c) Reduction in sodium and water retention (5 marks)
      - Direct effects on renal sodium and water handling (5 marks)

3. Direct Effects of Angiotensin II on Vessels and Heart (20 marks)

   a) Vasodilation due to reduced angiotensin II levels (10 marks)
      - Explanation of how reduced angiotensin II leads to vasodilation (5 marks)
      - Impact on afterload and cardiac workload (5 marks)

   b) Decrease in vasoconstriction and peripheral resistance (10 marks)
      - Understanding the relationship between angiotensin II and vasoconstriction (5 marks)
      - Consequences of reduced peripheral resistance on blood pressure and heart function (5 marks)

4. Remodeling Effects (20 marks)

   a) Inhibition of myocardial and vascular remodeling (10 marks)
      - Definition and explanation of remodeling (5 marks)
      - Mechanism by which ACE inhibitors inhibit this process (5 marks)

   b) Prevention of hypertrophy and fibrosis (5 marks)
      - Explanation of hypertrophy and fibrosis (2.5 marks)
      - Role of ACE inhibitors in preventing these conditions (2.5 marks)

   c) Long-term benefits on morbidity and mortality in HFrEF (5 marks)
      - Presentation of clinical evidence or studies showing reduced morbidity and mortality (5 marks)`
      },
      aiModel: "gpt-4o-mini", // Add this field
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
    console.log("AI Model:", question.aiModel);
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