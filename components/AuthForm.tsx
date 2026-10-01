"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {Form} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import FormField from "./FormField"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/client"
import { signIn, signUp } from "@/lib/actions/auth.action"

const formSchema = z.object({
    username: z.string().min(2).max(50),
})

// Create a custom dynamic schema based on the form
const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === 'sign-up' ? z.string().min(3) : z.string().optional(),
        email: z.email(),
        password: z.string().min(3)
    })
}

const AuthForm = ({ type }: {
    type: 'sign-in' | 'sign-up'
}) => {
    const formSchema = authFormSchema(type)
    const router = useRouter()

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })

    // Turn Firebase auth error codes into messages a user can act on
    const getAuthErrorMessage = (error: unknown) => {
        const code = (error as { code?: string })?.code
        switch (code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                return 'Incorrect email or password. Please try again.'
            case 'auth/email-already-in-use':
                return 'An account with this email already exists. Try signing in.'
            case 'auth/weak-password':
                return 'Password is too weak. Use at least 6 characters.'
            case 'auth/invalid-email':
                return 'Please enter a valid email address.'
            case 'auth/too-many-requests':
                return 'Too many attempts. Please wait a moment and try again.'
            case 'auth/network-request-failed':
                return 'Network error. Check your connection and try again.'
            default:
                return 'Something went wrong. Please try again.'
        }
    }

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        try {
            if (type === 'sign-up') {
                // Fetching data from the form
                const {name, email, password} = values

                // Authenticate user credentials
                const userCredentials = await createUserWithEmailAndPassword(auth, email, password)
                
                // Send ID token for session creation
                const result = await signUp({
                    uid: userCredentials.user.uid,
                    name: name!,
                    email,
                    password
                })

                if (!result?.success) {
                    toast.error(result?.message)
                    return
                }

                toast.success("Account created successfully. Please sign in.")
                router.push('/sign-in')
            } else {
                const {email, password} = values
                // Get credentials ( authenticated )
                const userCredentials = await signInWithEmailAndPassword(auth, email, password)
                // Get a short live id token
                const idToken = await userCredentials.user.getIdToken()
                if (!idToken) {
                    toast.error("Sign in failed")
                    return ;
                }

                // Send ID token for session creation (cookies , etc.. )
                await signIn({
                    email, idToken
                })

                toast.success("Sign in successfully")
                router.push('/')
            }
        } catch (error) {
            console.log(error)
            toast.error(getAuthErrorMessage(error))
        }
    }

    const isSignIn = type === 'sign-in'

    return (
        <div className="card-border lg:min-w-[566px]">
            {/* Header with logo and title */}
            <div className="flex flex-col gap-6 card py-14 px-10">
                <div className="flex flex-row gap-2 justify-center">
                    <Image
                        src="/logo.svg"
                        alt="logo"
                        height={32}
                        width={38}
                    />
                    <h2 className="text-primary-100">PrepBot</h2>
                </div>
                <h3>Practice job interview with AI</h3>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4 form">
                        {!isSignIn && (
                            <FormField
                                control={form.control}
                                name="name"
                                label="Name"
                                placeholder="Your Name"
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="email"
                            label="Email"
                            placeholder="Your Email"
                            type="email"
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            label="Password"
                            placeholder="Enter Your Password"
                            type="password"
                        />
                        <Button className="btn" type="submit">{isSignIn ? "Sign in" : "Create an Account"}</Button>
                        <p className="text-center">
                            {isSignIn ? "No account yet?" : "Have an account already"}
                            <Link href={!isSignIn ? '/sign-in' : '/sign-up'} className="font-bold text-user-primary ml-1" >
                                {isSignIn ? "Sign up" : "Sign in"}
                            </Link>
                        </p>
                    </form>
                </Form>
            </div>
        </div>

    )
}

export default AuthForm