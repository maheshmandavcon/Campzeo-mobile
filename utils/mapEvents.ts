
export const mapEvents = (posts: any[]): any[] => {
  // console.log("ppppptttt",posts);
  
  return posts.map((post) => {
    const start = new Date(post.scheduledPostTime || post.publishedDate || post.createdAt || new Date());

    return {
      id: post.id,
      title: post.type, 
      mediaUrls: post.mediaUrls[0],
      start,
      end: start,
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
