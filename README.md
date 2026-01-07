# Welcome to Campzeo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

# 🧰 Campzeo App – Tools & Libraries Used

This document provides an overview of the major tools and libraries used in the **Campzeo Mobile Application**, along with their purpose and role in the project architecture.

---

## 🔐 Clerk – Authentication & User Management

🧩 **Purpose:** Authentication, authorization, and user identity management.

**Clerk** is used to handle:
- Secure user authentication (Sign In / Sign Up)
- Social login (Google, etc.)
- Session handling
- Token-based access for API calls

**Why Clerk?**
- Seamless integration with Expo & React Native
- Built-in UI components
- Secure and scalable auth solution

---

## 🎨 NativeWind – Styling Library (Tailwind for React Native)

🧩 **Purpose:** Utility-first styling for React Native.

**NativeWind** allows writing Tailwind-style classes directly in React Native components.

**Key Benefits:**
- Faster UI development
- Consistent design system
- Clean and readable styling code
- Responsive and theme-friendly layouts

---

## 🧱 Gluestack UI – Component Library

🧩 **Purpose:** Prebuilt UI components with theme support.

**Gluestack UI** provides:
- Reusable UI primitives (Box, VStack, HStack, Text, Button, etc.)
- Dark & Light mode compatibility
- Accessibility-first components

**Why Used?**
- Reduces boilerplate UI code
- Works well with Expo & NativeWind
- Consistent component behavior across the app

---

## 📅 React Native Big Calendar – Calendar & Scheduling

🧩 **Purpose:** Display calendar-based events and schedules.

**React Native Big Calendar** is used for:
- Monthly / weekly / daily calendar views
- Displaying campaigns, schedules, or logs
- Interactive event rendering

**Use Case in Campzeo:**
- Visualizing scheduled campaigns and activities
- Managing time-based data efficiently

---

## 🧠 Zustand – Global State Management

🧩 **Purpose:** Lightweight state management.

**Zustand** is used to manage:
- Global app state
- Shared data between screens
- UI and logic state without prop drilling

**Advantages:**
- Simple API
- No boilerplate (unlike Redux)
- High performance
- Easy to scale

---

## 📝 React Hook Form (RHF) – Form Management

🧩 **Purpose:** Handling form state and submission.

**React Hook Form** provides:
- Efficient form handling
- Minimal re-renders
- Easy integration with validation libraries

**Used For:**
- Login / signup forms
- Campaign creation forms
- User input handling

---

## 🛡️ Zod – Schema-Based Validation

🧩 **Purpose:** Form validation and data safety.

**Zod** is used along with RHF to:
- Define strict validation schemas
- Validate form inputs
- Ensure type-safe data handling

**Why Zod?**
- TypeScript-friendly
- Clear error messages
- Strong runtime validation

---

## 🔗 Axios – API Communication

🧩 **Purpose:** HTTP client for backend communication.

**Axios** is used for:
- Making API requests (GET, POST, PUT, DELETE)
- Handling request/response interceptors
- Centralized error handling

**Benefits:**
- Cleaner syntax than fetch
- Automatic JSON parsing
- Interceptor support for auth tokens

---

## 📌 Summary Table

| Tool / Library | Purpose |
|---------------|--------|
| Clerk | Authentication & user management |
| NativeWind | Utility-first styling |
| Gluestack UI | UI component library |
| React Native Big Calendar | Calendar & scheduling |
| Zustand | Global state management |
| React Hook Form | Form handling |
| Zod | Form validation |
| Axios | API communication |

---

## ✅ Conclusion

The **Campzeo app** uses a modern, scalable, and developer-friendly tech stack.  
Each library is chosen to:
- Improve performance
- Maintain clean architecture
- Enhance developer productivity
- Ensure a smooth user experience

---

📘 *This document serves as a technical reference for understanding the tools used in the Campzeo application.*
