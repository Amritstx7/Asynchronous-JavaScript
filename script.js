function fetchUserProfile(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: userId,
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe"
      });
    }, 1000);
  });
}

function fetchUserPosts(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { postId: 1, userId: userId, title: "My First Post", content: "Hello world!" },
        { postId: 2, userId: userId, title: "Another Post", content: "Just another day..." },
        { postId: 3, userId: userId, title: "Final Post", content: "This is the last one." }
      ]);
    }, 1500);
  });
}

function fetchPostComments(postId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.3) {
        reject(new Error('Failed to fetch comments'));
        return;
      }
      resolve([
        { commentId: 1, postId: postId, username: "alice", comment: "Great post!" },
        { commentId: 2, postId: postId, username: "bob", comment: "Thanks for sharing." },
        { commentId: 3, postId: postId, username: "charlie", comment: "Interesting read." }
      ]);
    }, 2000);
  });
}

async function fetchDataSequentially(userId) {
  console.log('Starting sequential fetch...');
  const startTime = Date.now();
  const combinedData = { user: null, posts: [] };

  try {
    combinedData.user = await fetchUserProfile(userId);
    console.log('User profile retrieved:', combinedData.user);

    const posts = await fetchUserPosts(userId);
    console.log('Posts retrieved:', posts);

    for (const post of posts) {
      try {
        const comments = await fetchPostComments(post.postId);
        console.log(`Comments retrieved for post ${post.postId}:`, comments);
        combinedData.posts.push({ ...post, comments });
      } catch (error) {
        console.error(`Error fetching comments for post ${post.postId}:`, error.message);
        combinedData.posts.push({ ...post, comments: [] });
      }
    }
  } catch (error) {
    console.error('Error in sequential fetch:', error.message);
  }

  const endTime = Date.now();
  console.log(`Sequential fetch took ${endTime - startTime}ms`);
  return combinedData;
}

async function fetchDataInParallel(userId) {
  console.log('Starting parallel fetch...');
  const startTime = Date.now();
  const combinedData = { user: null, posts: [] };

  try {
    const [userResult, postsResult] = await Promise.allSettled([
      fetchUserProfile(userId),
      fetchUserPosts(userId)
    ]);

    if (userResult.status === 'fulfilled') {
      combinedData.user = userResult.value;
      console.log('User profile retrieved:', combinedData.user);
    }

    const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
    console.log('Posts retrieved:', posts);

    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        try {
          const comments = await fetchPostComments(post.postId);
          console.log(`Comments retrieved for post ${post.postId}:`, comments);
          return { ...post, comments };
        } catch (error) {
          console.error(`Error fetching comments for post ${post.postId}:`, error.message);
          return { ...post, comments: [] };
        }
      })
    );

    combinedData.posts = postsWithComments;
  } catch (error) {
    console.error('Error in parallel fetch:', error.message);
  }

  const endTime = Date.now();
  console.log(`Parallel fetch took ${endTime - startTime}ms`);
  return combinedData;
}

function displayResults(data, container) {
  container.innerHTML = '';
  if (!data.user) {
    container.innerHTML = '<p>User data not available.</p>';
    return;
  }

  const userDiv = document.createElement('div');
  userDiv.innerHTML = `<h2>User Profile</h2>
                       <p>ID: ${data.user.id}</p>
                       <p>Name: ${data.user.name}</p>
                       <p>Email: ${data.user.email}</p>
                       <p>Username: ${data.user.username}</p>`;
  container.appendChild(userDiv);

  data.posts.forEach(post => {
    const postDiv = document.createElement('div');
    postDiv.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p>`;
    
    if (post.comments.length > 0) {
      const commentsList = document.createElement('ul');
      post.comments.forEach(comment => {
        const li = document.createElement('li');
        li.textContent = `${comment.username}: ${comment.comment}`;
        commentsList.appendChild(li);
      });
      postDiv.appendChild(commentsList);
    } else {
      const noComments = document.createElement('p');
      noComments.textContent = 'No comments available.';
      postDiv.appendChild(noComments);
    }

    container.appendChild(postDiv);
  });
}

document.getElementById('sequentialBtn').addEventListener('click', async () => {
  const outputDiv = document.getElementById('output');
  const data = await fetchDataSequentially(1);
  displayResults(data, outputDiv);
});

document.getElementById('parallelBtn').addEventListener('click', async () => {
  const outputDiv = document.getElementById('output');
  const data = await fetchDataInParallel(1);
  displayResults(data, outputDiv);
});

