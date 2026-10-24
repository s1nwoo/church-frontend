import React from 'react';
import axios from 'axios';

export function fileSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}
export async function downloadAttachment(postId, file) {
  const token = localStorage.getItem('accessToken');
  const { data } = await axios.get(`/api/posts/${postId}/attachments/${file.id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}, responseType: 'blob'
  });
  const url = URL.createObjectURL(data), link = document.createElement('a');
  link.href = url; link.download = file.filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function PostAttachments({ post, onError = message => window.alert(message) }) {
  if (!post.attachments?.length) return null;
  return <ul className="post-attachments">{post.attachments.map(file => <li key={file.id}>
    <button type="button" onClick={() => downloadAttachment(post.id, file).catch(() => onError('첨부파일을 다운로드하지 못했습니다. 로그인 상태를 확인해 주세요.'))}>
      {file.filename} <small>({fileSize(file.size)}) · 다운로드</small>
    </button>
  </li>)}</ul>;
}
