import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './firebase';

/**
 * Upload an image file to Firebase Storage and return its public download URL.
 * Used by admin movie-create for banner/poster images.
 */
export async function uploadImageToFirebase(file, folder = 'images') {
  if (!file) {
    throw new Error('No file selected for upload');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `${folder}/${Date.now()}-${uuidv4()}-${safeName}`;
  const imageRef = ref(storage, objectPath);

  await uploadBytes(imageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });

  return getDownloadURL(imageRef);
}
