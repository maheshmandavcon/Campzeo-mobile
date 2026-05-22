type UserLike = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  name?: string | null;
  email?: string | null;
};

const clean = (value?: string | null) => (value || "").trim();

export const getDisplayName = (user?: UserLike | null) => {
  if (!user) return "User";

  const firstName = clean(user.firstName);
  const lastName = clean(user.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return fullName || clean(user.name) || clean(user.username) || clean(user.email) || "User";
};

export const getInitials = (user?: UserLike | null) => {
  if (!user) return "U";

  const firstName = clean(user.firstName);
  const lastName = clean(user.lastName);

  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  }

  const fallback = getDisplayName(user)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");

  return (fallback || "U").toUpperCase();
};
