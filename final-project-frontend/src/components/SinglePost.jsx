import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../assets/styles/SinglePost.css';

function SinglePost() {
  const [post, setPost] = useState({});

  const { id } = useParams(); // get ID from URL

  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = () => {
    axios
      .get(`/article/${id}`)
      .then(res => {
        setPost(res.data);
        console.log(res.data); // Data from API
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  return (
    <div className='main'>
      <section className='post'>
        {post ? (
          <div className='container'>
            <div className='single-post'>
              <h1 className='post-title'>{post.title}</h1>
              <img src={post.img} alt={post.title} className='post-image' />
              <p className='post-content'>{post.content}</p>
            </div>
          </div>
        ) : (
          <div className='container'>
            <p>No data</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default SinglePost;
