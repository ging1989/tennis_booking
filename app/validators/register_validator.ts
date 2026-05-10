import vine from "@vinejs/vine";

export const registerValidator = vine.compile(vine.object({
    full_name: vine.string().trim().minLength(2),
    phone: vine.string().trim().minLength(10),
    email: vine.string().trim().email(),
    password: vine.string().minLength(8).confirmed(),
}))