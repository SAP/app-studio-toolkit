const datauri = require("datauri/sync");

export function getImage(imagePath: string): string {
  let image;
  try {
    image = datauri(imagePath).content;
  } catch (error) {
    // TODO log the error
  }
  return image;
}
