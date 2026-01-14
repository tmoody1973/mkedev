import { SignUp } from "@clerk/nextjs";

/**
 * Sign-up page using Clerk's pre-built SignUp component.
 * Styled to match the neobrutalist MKE.dev design system.
 */
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-head text-3xl font-bold text-stone-900 dark:text-stone-50 mb-2">
            MKE.dev
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Milwaukee Civic Intelligence
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "border-2 border-black dark:border-white shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] rounded-none bg-white dark:bg-stone-900",
              headerTitle: "font-head text-stone-900 dark:text-stone-50",
              headerSubtitle: "text-stone-600 dark:text-stone-400",
              socialButtonsBlockButton:
                "border-2 border-black dark:border-white shadow-[2px_2px_0_black] dark:shadow-[2px_2px_0_white] rounded-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black] dark:hover:shadow-[1px_1px_0_white] transition-all",
              formButtonPrimary:
                "bg-sky-500 border-2 border-black dark:border-white shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] rounded-none hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_black] dark:hover:shadow-[2px_2px_0_white] transition-all",
              formFieldInput:
                "border-2 border-black dark:border-white rounded-none focus:ring-sky-500 focus:border-sky-500",
              footerActionLink: "text-sky-500 hover:text-sky-600",
              identityPreviewEditButton: "text-sky-500 hover:text-sky-600",
            },
          }}
        />
      </div>
    </div>
  );
}
