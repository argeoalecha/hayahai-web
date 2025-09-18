import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/config"
import { db } from "@/lib/database/client"
import { z } from "zod"

const f = createUploadthing()

// File upload middleware with authentication and validation
const authenticatedMiddleware = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error("Authentication required")
  }

  // Check if user is active
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      role: true,
    }
  })

  if (!user) {
    throw new Error("User not found or inactive")
  }

  return { userId: user.id, userRole: user.role }
}

// Image validation schema
const imageMetadata = z.object({
  alt: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  postId: z.string().cuid().optional(),
})

export const ourFileRouter = {
  // Profile image uploader
  profileImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const auth = await authenticatedMiddleware()
      return auth
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile image upload completed", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
      })

      // Update user profile image
      await db.user.update({
        where: { id: metadata.userId },
        data: { image: file.url }
      })

      // Log activity
      await db.activityLog.create({
        data: {
          userId: metadata.userId,
          action: 'UPDATE_PROFILE_IMAGE',
          resource: 'USER',
          resourceId: metadata.userId,
          details: {
            fileName: file.name,
            fileSize: file.size,
            fileUrl: file.url,
          },
        },
      }).catch(console.error)

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
      }
    }),

  // Post cover image uploader
  postCoverImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .input(imageMetadata)
    .middleware(async ({ input }) => {
      const auth = await authenticatedMiddleware()

      // Check if user can upload (author or admin)
      if (!['AUTHOR', 'ADMIN', 'SUPER_ADMIN'].includes(auth.userRole)) {
        throw new Error("Insufficient permissions to upload post images")
      }

      return { ...auth, metadata: input }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Post cover image upload completed", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
        alt: metadata.metadata.alt,
      })

      // Log activity
      await db.activityLog.create({
        data: {
          userId: metadata.userId,
          action: 'UPLOAD_POST_COVER',
          resource: 'UPLOAD',
          details: {
            fileName: file.name,
            fileSize: file.size,
            fileUrl: file.url,
            alt: metadata.metadata.alt,
            postId: metadata.metadata.postId,
          },
        },
      }).catch(console.error)

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        alt: metadata.metadata.alt,
        caption: metadata.metadata.caption,
      }
    }),

  // Post content images (multiple)
  postContentImages: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 10
    }
  })
    .input(z.object({
      postId: z.string().cuid().optional(),
      alt: z.string().max(200).optional(),
    }))
    .middleware(async ({ input }) => {
      const auth = await authenticatedMiddleware()

      if (!['AUTHOR', 'ADMIN', 'SUPER_ADMIN'].includes(auth.userRole)) {
        throw new Error("Insufficient permissions to upload content images")
      }

      return { ...auth, metadata: input }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Post content images upload completed", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
        postId: metadata.metadata.postId,
      })

      // If postId is provided, add to media gallery
      if (metadata.metadata.postId) {
        try {
          await db.mediaGallery.create({
            data: {
              postId: metadata.metadata.postId,
              url: file.url,
              alt: metadata.metadata.alt || file.name,
              type: 'image',
              order: 0, // Will be updated by the client or backend
            }
          })
        } catch (error) {
          console.error("Failed to add image to media gallery:", error)
        }
      }

      // Log activity
      await db.activityLog.create({
        data: {
          userId: metadata.userId,
          action: 'UPLOAD_CONTENT_IMAGE',
          resource: 'UPLOAD',
          details: {
            fileName: file.name,
            fileSize: file.size,
            fileUrl: file.url,
            postId: metadata.metadata.postId,
            alt: metadata.metadata.alt,
          },
        },
      }).catch(console.error)

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        alt: metadata.metadata.alt,
      }
    }),

  // Document uploader (for downloadable content)
  documents: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    text: { maxFileSize: "4MB", maxFileCount: 5 },
    blob: { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .input(z.object({
      postId: z.string().cuid().optional(),
      description: z.string().max(500).optional(),
    }))
    .middleware(async ({ input }) => {
      const auth = await authenticatedMiddleware()

      if (!['AUTHOR', 'ADMIN', 'SUPER_ADMIN'].includes(auth.userRole)) {
        throw new Error("Insufficient permissions to upload documents")
      }

      return { ...auth, metadata: input }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload completed", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })

      // Log activity
      await db.activityLog.create({
        data: {
          userId: metadata.userId,
          action: 'UPLOAD_DOCUMENT',
          resource: 'UPLOAD',
          details: {
            fileName: file.name,
            fileSize: file.size,
            fileUrl: file.url,
            fileType: file.type,
            postId: metadata.metadata.postId,
            description: metadata.metadata.description,
          },
        },
      }).catch(console.error)

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileType: file.type,
        description: metadata.metadata.description,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter