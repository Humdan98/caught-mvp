"use client";

import { createContext, startTransition, useContext } from "react";

const PendingContext = createContext<boolean | null>(null);
export const useActionFormPending = () => useContext(PendingContext);

/**
 * A <form> for a useActionState dispatcher that keeps what the user typed.
 *
 * React 19 resets a form after its `action` runs, which would wipe the inputs whenever
 * validation fails. After hydration we handle submit ourselves (preventDefault + transition);
 * React then only tracks pending state and skips its own action call and reset.
 * `action` stays on the element so a submit before hydration still POSTs to the server
 * action (never a GET that would put field values, like passwords, in the URL).
 */
export function ActionForm({
  dispatch,
  pending,
  children,
  ...props
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & {
  dispatch: (form: FormData) => void;
  pending: boolean;
}) {
  return (
    <PendingContext.Provider value={pending}>
      <form
        {...props}
        action={dispatch}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const data = new FormData(e.currentTarget);
          startTransition(() => dispatch(data));
        }}
      >
        {children}
      </form>
    </PendingContext.Provider>
  );
}
