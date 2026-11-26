import { redirect } from "next/navigation";

/** Short link for the food menu, for Instagram bios and WhatsApp. */
export default function FoodPage() {
  redirect("/menu?tab=food" as "/");
}
