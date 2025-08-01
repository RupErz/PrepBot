import { db } from "@/firebase/admin"

// Fetching interviews created from database with userId.
export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get()

    return interviews.docs.map((doc) => (
        {
            id: doc.id,
            ...doc.data()
        } 
    )) as Interview[]
}

// Get recent interviews from the other users.
export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params
    
    const interviews = await db
        .collection('interviews')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()

    return interviews.docs.map((doc) => (
        {
            id: doc.id,
            ...doc.data()
        } 
    )) as Interview[]
}

// Get interview detail by id
export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db
        .collection('interviews')
        .doc(id)
        .get()

    return interview.data() as Interview | null
}
