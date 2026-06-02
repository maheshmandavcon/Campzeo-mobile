import https from "./https";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organisationId: string;
  };
  success: boolean;
  message: string | null;
  errors: any | null;
}

export const login = async (email: string, password: string) => {
  try {
    const response = await https.post<LoginResponse>("Auth/Login", {
      email,
      password,
    });
    return response.data;
  } catch (error: any) {
    console.log("LOGIN ERROR STATUS:", error?.response?.status);
    console.log("LOGIN ERROR DATA:", error?.response?.data);
    throw error;
  }
};



// export const login = async (
//   email: string,
//   password: string
// ): Promise<LoginResponse> => {
//   try {
//     const res = await fetch(
//       `${process.env.EXPO_PUBLIC_API_BASE_URL}Auth/Login`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         body: JSON.stringify({
//           email,
//           password,
//         }),
//       }
//     );

//     console.log("RAW RESPONSE:", res);

//     // ⚠️ fetch does NOT throw on HTTP errors
//     const data = await res.json();

//     console.log("PARSED DATA:", data);

//     if (!res.ok) {
//       throw new Error(data?.message || "Login failed");
//     }

//     return data;
//   } catch (error: any) {
//     console.log("FETCH ERROR:", error , error.code);
//     throw error;
//   }
// };
