export interface ContentResponse {
  header: string;
  content: string[];
}

export const generateContent = (cr: ContentResponse) => {
  if (cr.content.length === 0) {
    return cr.header;
  }

  return `${cr.header}\n${cr.content.join("\n")}`;
};
