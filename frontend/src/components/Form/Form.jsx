import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
// import FileBase from 'react-file-base64'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

import { isImage } from '../../validImage'

import { createPost, getPosts, updatePost } from '../../services/posts'
import { setLoading } from '../../slices/loaderSlice'
import { setEditPost } from '../../slices/postsSlice'
import { logUserOut } from '../../slices/authSlice'
import { checkUserToken } from '../../services/checkUserToken'
import Loader from '../Loader'
import TagsInput from './TagsInput'

const emptyForm = {
  title: '',
  message: '',
  content: '',
  tags: [],
  selectedFile: '',
  additionalImages: [],
  attachments: [],
}

function Form() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { editPost } = useSelector((state) => state.posts)
  const { loading } = useSelector((state) => state.loading)
  const { user } = useSelector((state) => state.auth)

  const [tagInputs, setTagInputs] = useState([])

  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    if (editPost) {
      if (!checkUserToken()) {
        toast.info('Session Expired!')
        dispatch(logUserOut())
        return
      }
      setFormData({
        title: editPost.title,
        message: editPost.message,
        content: editPost.content || editPost.message || '',
        tags: editPost.tags,
        selectedFile: editPost.selectedFile,
        additionalImages: editPost.additionalImages || [],
        attachments: editPost.attachments || [],
      })
      setTagInputs(editPost.tags)
    }
  }, [editPost])

  useEffect(() => {
    if (tagInputs.length >= 1) {
      setFormData((prev) => ({ ...prev, tags: tagInputs }))
    }
  }, [tagInputs])

  const handleOnChange = (e) => {
    if (!checkUserToken()) {
      toast.info('Session Expired!')
      dispatch(logUserOut())
      return
    }
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleCoverImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !isImage(file)) {
      toast.error('Not Valid Image')
      return
    }
    setFormData((prev) => ({ ...prev, selectedFile: file }))
  }

  const handleAdditionalImageUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.some((file) => !isImage(file) && !file.type)) {
      toast.error('Unable to identify one of the selected files.')
      return
    }
    setFormData((prev) => ({ ...prev, attachments: files }))
  }

  const uploadImage = async (file) => {
    if (!file || typeof file === 'string') return file

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
    return result.secure_url
  }

  const uploadAttachment = async (file) => {
    if (!file) return null
    if (typeof file === 'string') {
      return { url: file, name: 'Image', type: 'image/*' }
    }
    if (file.url) return file

    const data = new FormData()
    const isImageFile = isImage(file)
    data.append('file', file)
    data.append('upload_preset', 'blogify-project')
    data.append('cloud_name', 'dcls2mzxc')

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dcls2mzxc/${
        isImageFile ? 'image' : 'raw'
      }/upload`,
      { method: 'post', body: data }
    )
    const result = await response.json()
    if (!response.ok || !result.secure_url) throw new Error('File upload failed')

    return { url: result.secure_url, name: file.name, type: file.type }
  }

  const handleContentImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !isImage(file)) {
      toast.error('Please select an image file.')
      return
    }

    try {
      dispatch(setLoading(true))
      const url = await uploadImage(file)
      setFormData((prev) => ({
        ...prev,
        content: `${prev.content}${prev.content ? '\n\n' : ''}![Post image](${url})`,
      }))
      e.target.value = ''
    } catch (error) {
      toast.error('Unable to upload the image.')
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleOnSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('You are not Logged In!')
      return
    }

    if (!checkUserToken()) {
      toast.info('Session Expired!')
      dispatch(logUserOut())
      return
    }

    dispatch(setLoading(true))
    try {
      const selectedFile = await uploadImage(formData.selectedFile)
      const attachments = (await Promise.all(
        formData.attachments.map(uploadAttachment)
      )).filter(Boolean)
      const additionalImages = await Promise.all(
        formData.additionalImages.map(uploadImage)
      )
      const post = {
        ...formData,
        selectedFile,
        additionalImages,
        attachments,
        name: editPost?.name || user.result.name,
        creator: editPost?.creator || user.result._id,
        createdAt: editPost?.createdAt || new Date().toISOString(),
      }

      if (editPost) {
        await dispatch(updatePost(post, editPost._id))
        dispatch(setEditPost(null))
        toast.success('Edited Successfully!')
      } else {
        await dispatch(createPost(post))
        dispatch(getPosts(1))
        navigate('/posts')
        toast.success('Posted Successfully!')
      }

      setTagInputs([])
      setFormData(emptyForm)
      e.target.reset()
    } catch (error) {
      toast.error('Unable to save the post. Please try again.')
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleClear = (e) => {
    e.preventDefault()
    setFormData(emptyForm)
    setTagInputs([])
  }

  const handleCancel = (e) => {
    e.preventDefault()
    dispatch(setEditPost(null))
    setFormData(emptyForm)
  }

  const { title, message, content } = formData

  if (loading) {
    return (
      <div className='w-full min-h-[400px] flex justify-center items-center rounded-lg shadow-lg p-6 transparentCard'>
        <Loader color='#BE185D' />
      </div>
    )
  }

  return (
    <div className='w-full rounded-lg shadow-lg p-6 transparentCard'>
      <p className='text-center mb-4'>
        {!editPost ? 'Creating a Blog' : 'Editing Blog'}
      </p>
      <form
        autoComplete='off'
        onSubmit={handleOnSubmit}
        className='flex flex-col gap-y-4'
      >
        <input
          type='text'
          name='title'
          required
          disabled={!user}
          value={title}
          onChange={handleOnChange}
          maxLength={60}
          placeholder='Title'
          className='border-[1px] border-slate-400 p-2 rounded-md bg-transparent placeholder:text-gray-700'
        />
        <textarea
          name='message'
          required
          disabled={!user}
          value={message}
          onChange={handleOnChange}
          maxLength={200}
          placeholder='Message / short summary'
          className='border-[1px] border-slate-400 p-2 resize-y rounded-md bg-transparent placeholder:text-gray-700'
        />
        <div className='flex flex-col gap-y-1'>
          <label htmlFor='content' className='text-sm font-medium text-gray-700'>
            Content
          </label>
          <textarea
            id='content'
            name='content'
            required
            disabled={!user}
            value={content}
            onChange={handleOnChange}
            rows={10}
            maxLength={5000}
            placeholder='Write the full blog content here...'
            className='border-[1px] border-slate-400 p-2 resize-y rounded-md bg-transparent placeholder:text-gray-700'
          />
          <input
            type='file'
            accept='image/*'
            onChange={handleContentImageUpload}
            disabled={!user}
          />
          <p className='text-xs text-gray-500'>
            Uploading an image appends it to the content.
          </p>
        </div>
        <TagsInput
          tagInputs={tagInputs}
          setTagInputs={setTagInputs}
          user={user}
        />
        <div className='flex flex-col gap-y-1'>
          <label htmlFor='cover-image' className='text-sm font-medium text-gray-700'>
            Cover image
          </label>
          <input
            id='cover-image'
            type='file'
            accept='image/*'
            onChange={handleCoverImageUpload}
            disabled={!user}
          />
        </div>
        <div className='flex flex-col gap-y-1'>
          <label htmlFor='additional-images' className='text-sm font-medium text-gray-700'>
            Additional images and files
          </label>
          <input
            id='additional-images'
            type='file'
            accept='image/*,application/pdf,.pdf,.doc,.docx,.txt'
            multiple
            onChange={handleAdditionalImageUpload}
            disabled={!user}
          />
        </div>
        <div className='w-full flex flex-col space-y-2'>
          <button
            type='submit'
            disabled={!user}
            className='bg-green-600 hover:bg-green-700 text-white cursor-pointer p-2 rounded-md uppercase'
          >
            {!editPost ? 'Submit' : 'Edit'}
          </button>

          {!editPost ? (
            <button
              onClick={handleClear}
              disabled={!user}
              className='bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-md'
            >
              Clear
            </button>
          ) : (
            <button
              onClick={handleCancel}
              disabled={!user}
              className='bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-md'
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default Form
