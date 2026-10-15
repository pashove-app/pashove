import { Ltr } from "@/components/ui/primitives";

/**
 * Insère une adresse dans une phrase traduite, en l'isolant du sens de lecture :
 * en arabe, une suite latine au milieu d'une phrase se coupe autrement en deux.
 */
export function withEmail(template: string, email: string) {
  if (!template.includes("{email}")) return template;

  const [before, after = ""] = template.split("{email}");

  return (
    <>
      {before}
      <Ltr className="font-medium text-body">{email}</Ltr>
      {after}
    </>
  );
}
