import { generateObject } from "ai"
import { z } from "zod"
import { google } from "@ai-sdk/google"
import { getRandomInterviewCover } from "@/lib/utils";
import { db } from "@/firebase/admin";
import { GEMINI_MODEL } from "@/constants";

// Give the Gemini request room to finish on serverless hosts
export const maxDuration = 60

export async function GET() {
    return Response.json({ success: true, data: "THANK YOU"}, { status: 200 })
}

const interviewSchema = z.object({
    role: z.string(),
    level: z.string(),
    techstack: z.string().describe("comma separated technologies"),
    type: z.string().describe("technical, behavioural or mixed"),
    questions: z.array(z.string()).min(1).describe("plain interview questions, no special characters like / or *")
})

// One Gemini request per interview keeps us inside the free tier quota
export async function POST(request: Request) {
    const body = await request.json()
    const { userid, transcript } = body

    try {
        // The client sends the voice conversation; otherwise use the details sent directly
        const source = transcript
            ? `Here is a conversation where a user described the mock interview they want:\n${transcript
                .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
                .join("\n")}`
            : `Role: ${body.role}\nLevel: ${body.level}\nTech stack: ${body.techstack}\nFocus: ${body.type}\nNumber of questions: ${body.amount}`

        const { object } = await generateObject({
            model: google(GEMINI_MODEL),
            maxRetries: 1,
            schema: interviewSchema,
            prompt: `Prepare questions for a job interview.
${source}

Return the role, experience level, tech stack and focus (technical, behavioural or mixed) the user wants, plus exactly the number of questions they asked for.
The focus between behavioural and technical questions should follow what the user asked for.
The questions will be read aloud by a voice assistant, so do not use "/" or "*" or any other characters that could break it.`
        })

        const interview = {
            role: object.role,
            type: object.type,
            level: object.level,
            techstack: object.techstack.split(',').map((t) => t.trim()),
            questions: object.questions,
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

        return Response.json({ success: false, error: "Could not generate the interview" }, { status: 500 })
    }
}
