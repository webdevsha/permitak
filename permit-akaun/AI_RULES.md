# AI Rules for Permit Akaun Application

This document outlines the core technologies used in this application and provides guidelines for using specific libraries and tools.

## Tech Stack

*   **React**: The primary JavaScript library for building user interfaces.
*   **Next.js**: The React framework used for server-side rendering, routing, and API routes.
*   **TypeScript**: The superset of JavaScript that adds static typing, used for all application code.
*   **Tailwind CSS**: A utility-first CSS framework for styling components.
*   **shadcn/ui**: A collection of reusable UI components built with Radix UI and styled with Tailwind CSS.
*   **Radix UI**: A low-level UI component library providing unstyled, accessible components, which shadcn/ui builds upon.
*   **Lucide React**: A library for easily integrating customizable SVG icons.
*   **SWR**: A React Hooks library for data fetching, caching, and revalidation.
*   **Sonner**: A modern toast library for displaying notifications.
*   **Next-themes**: A library for managing light and dark themes in Next.js applications.
*   **Vercel Analytics**: For collecting analytics data in the deployed application.

## Library Usage Rules

*   **UI Components**:
    *   **Always** prioritize using existing `shadcn/ui` components from `@/components/ui/` for common UI elements (e.g., `Button`, `Card`, `Dialog`, `Table`, `Input`, `Select`, `Badge`, `Sheet`, `Tabs`).
    *   **Do not** modify the files within `components/ui/`. If a `shadcn/ui` component needs significant customization or a new component is required, create a new component file in `src/components/` and style it with Tailwind CSS.
*   **Styling**:
    *   **Exclusively** use Tailwind CSS for all styling. Avoid inline styles or separate CSS modules unless absolutely necessary and explicitly approved.
*   **Icons**:
    *   **Always** use icons from the `lucide-react` library.
*   **Data Fetching**:
    *   **Always** use `SWR` for client-side data fetching and caching.
*   **Notifications**:
    *   **Always** use `sonner` for displaying toast notifications to the user.
*   **Routing**:
    *   **Always** use `next/navigation` for programmatic navigation within the application. Keep routes defined in `src/App.tsx`.
*   **State Management**:
    *   For local component state, use React's `useState` and `useEffect`.
    *   For global data fetching state, rely on `SWR`.
*   **Forms & Validation**:
    *   Use `react-hook-form` for form management and `zod` for schema validation.
*   **Date Manipulation**:
    *   Use `date-fns` for any date formatting or manipulation tasks.