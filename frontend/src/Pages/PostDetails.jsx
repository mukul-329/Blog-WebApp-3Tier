import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setLoading } from '../slices/loaderSlice'
import Loader from '../components/Loader'
import * as api from '../api'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { IoIosArrowBack } from 'react-icons/io'
import {
  AiOutlineLike,
  AiFillLike,
  AiOutlineEdit,
  AiOutlineDelete,
} from 'react-icons/ai'
import { toast } from 'react-toastify'
import { updatePost } from '../services/posts'
import { logUserOut } from '../slices/authSlice'
import { checkUserToken } from '../services/checkUserToken'
import PostDetailsComment from '../components/Posts/Post/PostDetailsComment'
import { setEditPost } from '../slices/postsSlice'

TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

function ContentBody({ content }) {
  const imagePattern = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/

  return content.split(/\n{2,}/).map((block, index) => {
    const image = block.trim().match(imagePattern)
    if (image) {
      return (
        <LazyLoadImage
          key={`${image[2]}-${index}`}
          alt={image[1] || 'Post content image'}
          effect='blur'
          src={image[2]}
          className='my-4 w-full rounded-lg object-contain shadow-md'
        />
      )
    }

    return (
      <p key={index} className='my-4 whitespace-pre-wrap text-justify leading-7 break-words'>
        {block}
      </p>
    )
  })
}

function PostDetails() {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const postId = location.pathname.split('/')[2]
  const { loading } = useSelector((state) => state.loading)
  const { user } = useSelector((state) => state.auth)
  const [postData, setPostData] = useState(null)
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isSavingContent, setIsSavingContent] = useState(false)
  // console.log('post Id', postId)

  const getPost = async () => {
    dispatch(setLoading(true))
    try {
      const { data } = await api.getPost(postId)
      dispatch(setLoading(false))
      setPostData(data)
      // console.log('post data', data)
    } catch (error) {
      // console.log('get post error', error)
      dispatch(setLoading(false))
    }
  }

  const handleOnLike = (likes) => {
    if (!user) {
      toast.error('You are not Logged In!')
      return
    }

    // checks if login token is still valid
    if (!checkUserToken()) {
      toast.info('Session Expired!')
      dispatch(logUserOut())
      return
    }
    let post = postData
    let updatedPost = {}
    const existingLike = likes.filter((like) => like === user.result._id)
    if (existingLike.length === 0) {
      updatedPost = { ...post, likes: [...likes, user.result._id] }
    } else {
      updatedPost = {
        ...post,
        likes: likes.filter((like) => like !== user.result._id),
      }
    }
    setPostData(updatedPost)
    dispatch(updatePost(updatedPost, post._id))
  }

  const handleCommentDel = (delComment) => {
    if (!user) {
      toast.error('You are not Logged In!')
      return
    }

    // checks if login token is still valid
    if (!checkUserToken()) {
      toast.info('Session Expired!')
      dispatch(logUserOut())
      return
    }
    let post = postData
    let updatedPost = {}

    if (post.comments.map((comment) => comment._id).includes(delComment._id)) {
      updatedPost = {
        ...post,
        comments: post.comments.filter(
          (comment) => comment._id !== delComment._id
        ),
      }
      setPostData(updatedPost)
      dispatch(updatePost(updatedPost, post._id))
    }
  }

  const handleEditPost = () => {
    dispatch(setEditPost(postData))
    navigate('/posts')
  }

  const handleDeletePost = async () => {
    if (!checkUserToken()) {
      toast.info('Session Expired!')
      dispatch(logUserOut())
      return
    }

    if (!window.confirm('Delete this post permanently?')) return

    try {
      await api.deletePost(postData._id)
      toast.success('Post deleted successfully!')
      navigate('/posts')
    } catch (error) {
      toast.error('Unable to delete this post. Please try again.')
    }
  }

  const handleStartContentEdit = () => {
    setEditedContent(postData.content || postData.message || '')
    setIsEditingContent(true)
  }

  const handleContentImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file?.type?.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }

    try {
      setIsSavingContent(true)
      const data = new FormData()
      data.append('file', file)
      data.append('upload_preset', 'blogify-project')
      data.append('cloud_name', 'dcls2mzxc')
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dcls2mzxc/image/upload',
        { method: 'post', body: data }
      )
      const result = await response.json()
      if (!response.ok || !result.secure_url) throw new Error('Image upload failed')
      setEditedContent((current) =>
        `${current}${current ? '\n\n' : ''}![Post image](${result.secure_url})`
      )
      e.target.value = ''
    } catch (error) {
      toast.error('Unable to upload the image.')
    } finally {
      setIsSavingContent(false)
    }
  }

  const handleSaveContent = async () => {
    if (!checkUserToken()) {
      toast.info('Session Expired!')
      dispatch(logUserOut())
      return
    }

    try {
      setIsSavingContent(true)
      const { data } = await api.updatePost(
        { ...postData, content: editedContent },
        postData._id
      )
      setPostData(data)
      setIsEditingContent(false)
      toast.success('Content saved successfully!')
    } catch (error) {
      toast.error('Unable to save content. Please try again.')
    } finally {
      setIsSavingContent(false)
    }
  }

  useEffect(() => {
    getPost()
  }, [])

  if (loading || postData === null) {
    return (
      <div className='w-11/12 md:w-[60%] lg:w-[70%] grid grid-cols-1 justify-items-center md:justify-items-start md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6 mb-6'>
        <Loader />
      </div>
    )
  } else {
    const {
      title,
      message,
      content,
      name,
      creator,
      tags,
      selectedFile,
      additionalImages = [],
      attachments = [],
      createdAt,
      likes,
    } = postData
    const galleryImages = [
      ...additionalImages,
      ...attachments
        .filter((attachment) => attachment?.type?.startsWith('image/'))
        .map((attachment) => attachment.url),
    ]
    const documentAttachments = attachments.filter(
      (attachment) => !attachment?.type?.startsWith('image/')
    )

    return (
      <div className='flex flex-col md:flex-row max-w-[1000px] mx-auto gap-x-6 items-start justify-between md:mb-6'>
        <div className='transparentCard w-full max-w-[500px] md:max-w-[unset] mx-auto md:mx-0 md:w-[50%] p-6 flex flex-col-reverse gap-y-6 md:gap-y-0'>
          {/* text */}
          <div className='w-full max-w-[500px] mx-auto'>
            <div>
              <p className='text-3xl font-semibold mt-4'>{title}</p>
              {tags && (
                <div className='flex items-center gap-x-2 mt-1'>
                  {tags.map((tg, index) => (
                    <p key={index} className='text-gray-500 text-lg'>
                      #{tg}
                    </p>
                  ))}
                </div>
              )}
              {message && content && (
                <p className='max-w-[98%] text-justify leading-7 break-words w-full mt-4 font-medium'>
                  {message}
                </p>
              )}
              {isEditingContent ? (
                <div className='my-4 flex flex-col gap-y-3'>
                  <label htmlFor='edit-content' className='font-medium text-gray-700'>
                    Content
                  </label>
                  <textarea
                    id='edit-content'
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={12}
                    maxLength={5000}
                    className='w-full resize-y rounded-md border border-slate-400 bg-transparent p-2'
                  />
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleContentImageUpload}
                    disabled={isSavingContent}
                  />
                  <div className='flex gap-x-2'>
                    <button
                      onClick={handleSaveContent}
                      disabled={isSavingContent}
                      className='rounded-md bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:opacity-60'
                    >
                      {isSavingContent ? 'Saving...' : 'Save content'}
                    </button>
                    <button
                      onClick={() => setIsEditingContent(false)}
                      disabled={isSavingContent}
                      className='rounded-md bg-gray-500 px-3 py-1 text-white hover:bg-gray-600 disabled:opacity-60'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <ContentBody content={content || message || ''} />
              )}
              {galleryImages.length > 0 && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 my-4'>
                  {galleryImages.map((image, index) => (
                    <LazyLoadImage
                      key={`${image}-${index}`}
                      alt={`Post image ${index + 1}`}
                      effect='blur'
                      src={image}
                      className='w-full rounded-lg object-cover shadow-md'
                    />
                  ))}
                </div>
              )}
              {documentAttachments.length > 0 && (
                <div className='my-4'>
                  <p className='mb-2 font-semibold'>Attachments</p>
                  <div className='flex flex-col gap-y-1'>
                    {documentAttachments.map((attachment, index) => (
                      <a
                        key={`${attachment.url}-${index}`}
                        href={attachment.url}
                        target='_blank'
                        rel='noreferrer'
                        className='text-blue-700 underline break-all'
                      >
                        {attachment.name || 'Download attachment'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className='flex justify-between'>
              <div
                className='flex items-center space-x-1 cursor-pointer'
                onClick={() => handleOnLike(likes)}
              >
                {user && likes.length > 0 && likes.includes(user.result._id) ? (
                  <AiFillLike className='text-blue-600 text-xl' />
                ) : (
                  <AiOutlineLike className='text-blue-600 text-xl' />
                )}
                <p className='text-xl'>{likes.length}</p>
              </div>
              <div>
                {user && user.result._id === creator && (
                  <div className='mb-2 flex flex-wrap gap-2'>
                    <button
                      onClick={handleStartContentEdit}
                      className='flex items-center gap-x-1 rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700'
                    >
                      <AiOutlineEdit /> Edit content
                    </button>
                    <button
                      onClick={handleEditPost}
                      className='flex items-center gap-x-1 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700'
                    >
                      <AiOutlineEdit /> Edit post
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className='flex items-center gap-x-1 rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700'
                    >
                      <AiOutlineDelete /> Delete post
                    </button>
                  </div>
                )}
                <p className='text-gray-700 text-right text-xl flex items-center gap-x-2'>
                  <span className='font-bold text-black'>Created By:</span>
                  {name}
                </p>
                <p className='text-gray-700 text-right text-xl flex items-center gap-x-2'>
                  <span className='font-bold text-black'>Posted :</span>
                  {timeAgo.format(new Date(createdAt))}
                </p>
              </div>
            </div>
          </div>
          {/* image */}
          <div className='w-full max-w-[500px] mx-auto'>
            <p
              onClick={() => navigate(-1)}
              className='mb-4 flex items-center cursor-pointer text-gray-500 hover:text-gray-800'
            >
              <IoIosArrowBack /> Go Back
            </p>
            <div className='w-full h-max flex justify-center items-center'>
              <LazyLoadImage
                alt='post'
                effect='blur'
                src={
                  selectedFile !== ''
                    ? selectedFile
                    : '../Assets/placeholder.webp'
                }
                className='w-full rounded-lg object-contain shadow-xl'
              />
            </div>
          </div>
        </div>
        <PostDetailsComment
          user={user}
          id={postId}
          post={postData}
          handleCommentDel={handleCommentDel}
        />
      </div>
    )
  }
}

export default PostDetails
