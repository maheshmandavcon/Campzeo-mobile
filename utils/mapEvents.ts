
export const mapEvents = (posts: any[]): any[] => {
  // console.log("ppppptttt",posts);
  
  return posts.map((post) => {
    let dStr = post.isPostSent 
      ? (post.publishedAt || post.publishedDate || post.createdAt || post.scheduledPostTime || new Date())
      : (post.scheduledPostTime || post.publishedAt || post.publishedDate || post.createdAt || new Date());
      
    // Force UTC parsing for all backend dates if they are missing the timezone identifier
    if (typeof dStr === 'string' && !dStr.endsWith('Z')) {
      dStr += 'Z';
    }
    
    const start = new Date(dStr);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration for grid rendering

    return {
      id: post.id,
      title: post.type, 
      mediaUrls: post.mediaUrls[0],
      start,
      end,
      isPostSent: post.isPostSent,
      platform: post.type,
      message: post.message,
      subject: post.subject,
      scheduledPostTime: post.scheduledPostTime,
      // keep campaign if you still want it in modal
      campaign: post.campaign?.name ?? ""
    };
  });
};
