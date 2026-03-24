import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export const createUser = async (data: any) => {
    try {
        const [user] = await db.insert(users).values(data).returning();
        return user;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const findUserByEmail = async (email: string) => {
  try {
    return db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
};
