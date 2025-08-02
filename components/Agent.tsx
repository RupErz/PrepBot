"use client";

import { interviewer } from '@/constants'
import { createFeedback } from '@/lib/actions/general.action';
import { cn } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sdk'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED'
}

interface SavedMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

const Agent = ({ userName, userId, type, questions, interviewId }: AgentProps) => {
    const router = useRouter();
    
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE)
    const [messages, setMessages] = useState<SavedMessage[]>([])

    const latestMessage = messages[messages.length - 1]?.content
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED
 
    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING)

        // If this is GENERATE interview
        // using a predefined workflow we already attach with the workflow id
        if (type === 'generate') {
            await vapi.start(
                undefined,
                undefined,
                undefined,
                process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,
                {
                    variableValues: {
                        username: userName,
                        userid: userId
                    }
                }
            )
        // Otherwise this is ACTUAL INTERVIEW
        // Connect to another interviewer in 'constants'
        } else {
            let formattedQuestion = ""
            if (questions) {
                formattedQuestion = questions
                    .map((question) => `- ${question}`)
                    .join("\n")
            }

            await vapi.start(interviewer, {
                variableValues: {
                    questions: formattedQuestion
                }
            })
        }
    }

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED)
        vapi.stop()
    }

    // Take the transcript to generate the feedbacl
    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        console.log("Generate feedback here. ")

        // TODO: Create a server action that generates feedback.
        const { success, feedbackId: id } = await createFeedback({
            interviewId: interviewId!, 
            userId: userId!,
            transcript: messages
        })

        if (success && id) {
            router.push(`/interview/${interviewId}/feedback`)
        } else {
            console.log("Error saving feedback")
            router.push('/')
        }
    }

    // Tell our app what it needs to do whenever a certain stage of convo with Vapi get trigger
    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE)
        const onCallEnd = () => setCallStatus(CallStatus.FINISHED)
        const onMessage = (message: Message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage = { role: message.role, content: message.transcript }
                setMessages((prev) => [...prev, newMessage])
            }
        }

        const onSpeechStart = () => setIsSpeaking(true)
        const onSpeechEnd = () => setIsSpeaking(false)

        const onError = (error: Error) => console.log('Error', error)

        // Like a event listener
        vapi.on('call-start', onCallStart)
        vapi.on('call-end', onCallEnd)
        vapi.on('message', onMessage)
        vapi.on('speech-start', onSpeechStart)
        vapi.on('speech-end', onSpeechEnd)
        vapi.on('error', onError)

        return () => {
            vapi.off('call-start', onCallStart)
            vapi.off('call-end', onCallEnd)
            vapi.off('message', onMessage)
            vapi.off('speech-start', onSpeechStart)
            vapi.off('speech-end', onSpeechEnd)
            vapi.off('error', onError)
        }
    }, [])

    useEffect(() => {
        if (callStatus === CallStatus.FINISHED) {
            if (type === 'generate') {
                router.push("/")
            } else {
                handleGenerateFeedback(messages) // router.push with extra steps , generate sme feedbacks
            }
        }
        // Error handling when assistant end the call 
        // if (callStatus === CallStatus.FINISHED) {
        // // Try/catch to prevent unhandled promise rejection
        // try {
        //     router.push("/");
        // } catch (err) {
        //     console.error("Navigation error:", err);
        // } finally {
        //     console.log("We finish")
        // }
    }, [messages, callStatus, type, userId])

    return (
        <>
            <div className='call-view'>
                {/* AI Card */}
                <div className='card-interviewer'>
                    <div className='avatar'>
                        <Image 
                            src="/ai-avatar.png"
                            alt='vapi'
                            width={65}
                            height={54}
                            className='object-cover'
                        />
                        {isSpeaking && <span className='animate-speak' />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                {/* User Card */}
                <div className='card-border'>
                    <div className='card-content'>
                        <Image 
                            src="/user-avatar.png"
                            alt='user avatar'
                            width={540}
                            height={540}
                            className='rounded-full object-cover size-[120px]'
                        />
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>

            {/* Transcript of the conversation */}
            {messages.length > 0 && (
                <div className='transcript-border'>
                    <div className='transcript'>
                        <p key={latestMessage} className={cn("transition-opacity duration-500 opacity-0", 'animate-fadeIn opacity-100')}>
                            {latestMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className='w-full flex justify-center'>
                {callStatus !== 'ACTIVE' ? (
                    <button className='relative btn-call' onClick={handleCall}>
                        <span className={cn('absolute animate-ping rounded-full opacity-75', callStatus !== 'CONNECTING' && 'hidden')} />

                        <span>
                            {isCallInactiveOrFinished ? 'Call' : '. . .'}
                        </span>
                    </button>
                ) : (
                    <button className='btn-disconnect' onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>
        </>
        
    )
}

export default Agent