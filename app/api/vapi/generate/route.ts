import { generateText, generateObject } from "ai"
import { z } from "zod"
import { google } from "@ai-sdk/google"
import { getRandomInterviewCover } from "@/lib/utils";
import { db } from "@/firebase/admin";
import { GEMINI_MODEL } from "@/constants";

// Two sequential Gemini calls can exceed the default serverless limit
export const maxDuration = 60

export async function GET() {
    return Response.json({ success: true, data: "THANK YOU"}, { status: 200 })
}

// Sending Data in the body of the request ( send from client to server )
export async function POST(request: Request) {
    const body = await request.json()
    const { userid, transcript } = body

    try {
        let { type, role, level, techstack, amount } = body

        // Client sends the voice conversation; pull the interview details out of it
        if (transcript) {
            const { object } = await generateObject({
                model: google(GEMINI_MODEL),
                schema: z.object({
                    role: z.string(),
                    level: z.string(),
                    techstack: z.string().describe("comma separated technologies"),
                    type: z.string().describe("technical, behavioural or mixed"),
                    amount: z.number().int().min(1).max(15)
                }),
                prompt: `Extract the mock interview details the user asked for from this conversation:\n${transcript
                    .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
                    .join("\n")}`
            })
            ;({ role, level, techstack, type, amount } = object)
        }

        // Make a prompt to store questions 
        const { text: questions } = await generateText({
        model: google(GEMINI_MODEL),
        prompt: `Prepare questions for a job interview.
            The job role is ${role}.
            The job experience level is ${level}.
            The tech stack used in the job is: ${techstack}.
            The focus between behavioural and technical questions should lean towards: ${type}.
            The amount of questions required is ${amount}.
            Please return only questions, without any additional text.
            The questions are going to be read by a voice assistant so do not use "/" or "*" or any other characters
            which might break the voice assistant.
            Return the questions formatted like this:
            ["Question 1", "Question 2", "Question 3"]
            
            Thank you <3 ^0^ !`
        });

        const interview = {
            role: role,
            type: type,
            level: level,
            techstack: techstack.split(',').map((t: string) => t.trim()),
            questions: JSON.parse(questions.replace(/```(?:json)?/g, "").trim()),
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString()
        }

        // Adding to database
        await db.collection("interviews").add(interview)

        return Response.json({ success: true }, { status: 200 })


    } catch (error) {
        console.error(error)

        return Response.json({ success: false, error }, { status: 500 })
    }
}