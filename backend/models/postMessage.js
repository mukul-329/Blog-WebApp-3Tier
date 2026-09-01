import mongoose from 'mongoose'

const postSchema = mongoose.Schema({
  title: String,
  message: String,
  content: String,
  name: String,
  creator: String,
  tags: [String],
  selectedFile: String,
  additionalImages: {
    type: [String],
    default: [],
  },
  attachments: {
    type: [
      {
        url: String,
        name: String,
        type: String,
      },
    ],
    default: [],
  },
  likes: {
    type: [String],
    default: [],
  },
  comments: {
    type: [
      {
        creator: String,
        comment: String,
        createdAt: {
          type: 'Date',
          default: new Date().toISOString(),
        },
      },
    ],
    default: [],
  },
  createdAt: {
    type: 'Date',
    default: new Date().toISOString(),
  },
})

const PostMessage = mongoose.model('PostMessage', postSchema)

export default PostMessage
