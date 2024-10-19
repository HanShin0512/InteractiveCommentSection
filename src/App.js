import React, { useState, useEffect } from 'react';
import data from './data.json'; // Import the data.json file
import './App.css';

function CommentSection() {
    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [editingCommentID, setEditingCommentID] = useState(null);
    const [editText, setEditText] = useState(''); // Track the updated text for editing
    const [modalContent, setModalContent] = useState (null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [replyingToCommentID, setReplyingToCommentID] = useState(null); //get commentID of which one you're replying to
    const [replyText, setReplyText] = useState(''); 
    const currentUser = data.currentUser;

    useEffect(() => {
        const initialComments = data.comments.map(comment => ({
            ...comment,
            previousScore: comment.score, // Store the original score for comparison
            canIncrease: true,
            canDecrease: false,
            replies: comment.replies.map(reply => ({
                ...reply,
                previousScore: reply.score,
                canIncrease: true,
                canDecrease: false,
            })),
        }));
        setComments(initialComments);
    }, []);

    const newID = () => {
        const commentLength = comments.length; // Get the number of comments
        let repliesLength = 0; // Initialize repliesLength
    
        // Iterate through each comment
        comments.forEach((comment) => {
            // Check if the comment has replies and if so, add to repliesLength
            if (comment.replies && comment.replies.length > 0) {
                repliesLength += comment.replies.length;
            }
        });
    
        return commentLength + repliesLength + 1;
    };

    const createNewComment = (e) => {
        e.preventDefault();
        const newComment = {
            id: newID(),
            content: newCommentText,
            createdAt: "Just Now",
            score: 0,
            user: {
                image: { 
                    png: currentUser.image.png,
                    webp: currentUser.image.webp
                },
                username: currentUser.username
            },
            replies: []
        };
        setComments([...comments, newComment]);
        setNewCommentText('');
    };

    const handleReplyClick = (commentID) => {
        setReplyingToCommentID(commentID);
        setReplyText('');
    }

    const addScore = (id) => {
        const updatedComments = comments.map(comment => {
            if (comment.id === id) {
                // Allow increasing score if it’s within the range of original score + 1
                if (comment.score < comment.previousScore + 1) {
                    return {
                        ...comment,
                        score: comment.score + 1,
                    };
                }
            }
    
            const updatedReplies = comment.replies.map(reply => {
                if (reply.id === id) {
                    // Allow increasing score if it’s within the range of original score + 1
                    if (reply.score < reply.previousScore + 1) {
                        return {
                            ...reply,
                            score: reply.score + 1,
                        };
                    }
                }
                return reply;
            });
    
            return { ...comment, replies: updatedReplies };
        });
    
        setComments(updatedComments);
    };
    
    const reduceScore = (id) => {
        const updatedComments = comments.map(comment => {
            if (comment.id === id) {
                // Allow reducing score if it’s within the range of original score - 1
                if (comment.score > comment.previousScore - 1) {
                    return {
                        ...comment,
                        score: comment.score - 1,
                    };
                }
            }
    
            const updatedReplies = comment.replies.map(reply => {
                if (reply.id === id) {
                    // Allow reducing score if it’s within the range of original score - 1
                    if (reply.score > reply.previousScore - 1) {
                        return {
                            ...reply,
                            score: reply.score - 1,
                        };
                    }
                }
                return reply;
            });
    
            return { ...comment, replies: updatedReplies };
        });
    
        setComments(updatedComments);
    };

    const openDeleteModal = (commentID) => {
        setModalContent(
            <div className='deleteModal'>
                <p className='title'> Are you sure you want to delete? </p>
                <button className='modalConfirmBTN' onClick={() => deleteComment(commentID)}>Delete</button>
                <button className='modalCancelBTN' onClick={closeDeleteModal}>Cancel</button>
            </div>
        );
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => setIsDeleteModalOpen(false);
    
    const deleteComment = (commentID) => {
        const updatedComments = comments.map(comment => {
            if (comment.id === commentID) {
                return null; // Mark the comment for deletion
            }
            // Filter out the reply if it's in the replies array
            return {
                ...comment,
                replies: comment.replies.filter(reply => reply.id !== commentID) // Remove the specific reply
            };
        }).filter(Boolean); // Remove any null entries
    
        setComments(updatedComments);
        setIsDeleteModalOpen(false);
    };

    const handleEditClick = (id) => {
        // Check if the ID matches a comment
        const comment = comments.find(comment => comment.id === id);
        
        if (comment) {
            // Found a comment
            setEditingCommentID(id);
            setEditText(comment.content); // Set text for editing
            return;
        }
        
        // Check if the ID matches a reply
        for (const comment of comments) {
            const reply = comment.replies.find(reply => reply.id === id);
            if (reply) {
                // Found a reply
                setEditingCommentID(id);
                setEditText(reply.content); // Set text for editing
                return;
            }
        }
        
        // If we reach here, neither a comment nor a reply was found
        console.error("Comment or reply not found");
    };
    
    const openSaveModal = (id) => {
        setModalContent(
            <div className='saveModal'>
                <p className='title'> Do you want to save changes? </p>
                <button className='modalConfirmBTN' onClick={() => saveEditText(id)}>Save</button>
                <button className='modalCancelBTN' onClick={closeEditModal}>Cancel</button>
            </div>
        );
    
        const originalComment = comments.find(comment => comment.id === id) || comments
            .flatMap(comment => comment.replies)
            .find(reply => reply.id === id);
    
        // Check if there's a change to be saved
        if (originalComment && originalComment.content !== editText) {
            setIsSaveModalOpen(true);
        } else {
            setEditingCommentID(null);
        }
    };
       
    const closeEditModal = () => setIsSaveModalOpen(false);

    const saveEditText = (commentID) => {
        const updatedComments = comments.map(comment => {
            // Check if editing a comment
            if (comment.id === commentID) {
                return { ...comment, content: editText }; // Update the comment's content
            }
            // Check replies if the comment ID matches a reply
            return {
                ...comment,
                replies: comment.replies.map(reply => {
                    if (reply.id === commentID) {
                        return { ...reply, content: editText }; // Update the reply's content
                    }
                    return reply; // Return other replies unchanged
                })
            };
        });
    
        setComments(updatedComments);
        setEditingCommentID(null);
        setIsSaveModalOpen(false);
    };

    const openCancelModal = (id) => {
        setModalContent(
            <div className='cancelModal'>
                <p className='title'> Are you sure you want to discard changes? </p>
                <button 
                    className='modalConfirmBTN' 
                    onClick={() => {
                        setEditingCommentID(null);
                        setEditText(''); // Reset the editText when discarding
                        closeCancelModal();
                    }}
                >
                    Yes
                </button>
                <button className='modalCancelBTN' onClick={closeCancelModal}>No</button>
            </div>
        );
    
        setIsCancelModalOpen(true); // Open the cancel modal
    };

    const closeCancelModal = () => setIsCancelModalOpen(false);

    const addReply = (commentID) => {
        const commentToReplyTo = comments.find(comment => comment.id === commentID);
    
        if (!commentToReplyTo) {
            console.error("Comment not found for ID:", commentID);
            return;
        }
    
        const newReply = {
            id: newID(),
            content: replyText,
            createdAt: 'Just Now',
            score: 0,
            replyingTo: commentToReplyTo.user.username,
            user: {
                image: {
                    png: currentUser.image.png,
                    webp: currentUser.image.webp,
                },
                username: currentUser.username,
            },
            replies: [] // Initialize replies as an empty array
        };
    
        const updatedComments = comments.map(comment => {
            if (comment.id === commentID) {
                return {
                    ...comment,
                    replies: [...comment.replies, newReply], // Add the new reply to the existing replies
                };
            }
            return comment;
        });
    
        setComments(updatedComments);
        setReplyingToCommentID(null);
        setReplyText('');
    };

    return (
        <div className="comments-container">
            {
                (isDeleteModalOpen || isSaveModalOpen || isCancelModalOpen) && (
                    <div className='modalContainer'>
                        <div className='popupModal'>
                            {modalContent}
                        </div>
                    </div>
                )
            }
            {comments.map((comment) => (
                <React.Fragment key={comment.id}>
                    <div className="comment">
                        <div className='left'> {/*score*/}
                            <button className='plusScore' onClick={() => addScore(comment.id)}>+</button>
                            <p className='scoreText'>{comment.score}</p>
                            <button className='minusScore' onClick={() => reduceScore(comment.id)}>-</button>
                        </div>

                        <div className='right'>
                            <div className='top'>
                                <div className='top-left'> {/*profile picture, username and time status*/}
                                    <img src={comment.user.image.png} alt={comment.user.username} />
                                    <p className='userName'>{comment.user.username}</p>
                                    <p className='createdTime'>{comment.createdAt}</p>
                                </div>
                                <div className='top-right'>
                                    {comment.user.username === currentUser.username ? (
                                        <>
                                            {/*save or cancel */}
                                            {editingCommentID === comment.id ? ( 
                                                <>
                                                    <button className='saveBTN' onClick={() => openSaveModal(comment.id)} > <i className='bx bx-save'></i> Save</button>
                                                    <button className='cancelBTN' onClick={() => openCancelModal(comment.id)}><i className='bx bx-x-circle'></i>Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className='editBTN' onClick={() => handleEditClick(comment.id)}> <i className='bx bx-edit'></i> Edit </button>
                                                    <button className='deleteBTN' onClick={() => openDeleteModal(comment.id)}> <i className='bx bx-trash'></i> Delete</button>
                                                </>
                                            )}
                                        </>
                                    ) : ( 
                                        <i className='bx bx-reply' onClick={() => handleReplyClick(comment.id)}>Reply</i> //reply
                                    )}
                                </div>
                            </div>

                            {
                                editingCommentID === comment.id ? (
                                    <textarea rows={4} cols={50} value={editText} onChange={(e) => setEditText(e.target.value)} /> //textarea for edit
                                ) : (
                                    <p className='context'>{comment.content}</p> //show comment
                                )
                            }
                        </div>
                    </div> 

                    {/* Replies container right after each comment */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="replies">
                            {comment.replies.map((reply) => (
                                <div key={reply.id} className="reply">
                                    <div className='left'> {/*score*/}
                                        <button className='plusScore' onClick={() => addScore(reply.id)}>+</button>
                                        <p className='scoreText'>{reply.score}</p>
                                        <button className='minusScore' onClick={() => reduceScore(reply.id)}>-</button>
                                    </div>

                                    <div className='right'>
                                        <div className='top'>
                                            <div className='top-left'> {/*profile picture, username and time status*/}
                                                <img src={reply.user.image.png} alt={reply.user.username} />
                                                <p className='userName'>{reply.user.username}</p>
                                                <p className='createdTime'>{reply.createdAt}</p>
                                            </div>
                                            <div className='top-right'>
                                                {reply.user.username === currentUser.username ? (
                                                    <>
                                                        {/*save or cancel */}
                                                        {editingCommentID === reply.id ? ( 
                                                            <>
                                                                <button className='saveBTN' onClick={() => openSaveModal(reply.id)} > <i className='bx bx-save'></i> Save</button>
                                                                <button className='cancelBTN' onClick={() => openCancelModal(reply.id)}><i className='bx bx-x-circle'></i>Cancel</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button className='editBTN' onClick={() => handleEditClick(reply.id)}> 
                                                                    <i className='bx bx-edit'></i> Edit
                                                                </button>

                                                                <button className='deleteBTN' onClick={() => openDeleteModal(reply.id)}> <i className='bx bx-trash'></i> Delete</button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : ( 
                                                    <i className='bx bx-reply' onClick={() => handleReplyClick(reply.id)}>Reply</i> //reply
                                                )}
                                            </div>
                                        </div>

                                        {
                                            editingCommentID === reply.id ? (
                                                <textarea rows={4} cols={50} value={editText} onChange={(e) => setEditText(e.target.value)} /> //textarea for edit
                                            ) : (
                                                <p className='context'> <span className='replyingTo'>@{reply.replyingTo}</span> {reply.content}</p> //show reply content
                                            )
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Show textarea under the comment when replying */}
                    {(replyingToCommentID === comment.id || comment.replies.some(reply => reply.id === replyingToCommentID)) && (
                        <div className="replyInput">
                            <img src={currentUser.image.png} alt={currentUser.username} />
                            <textarea
                                rows={4}
                                cols={50}
                                placeholder='Add a reply...'
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button type='submit' onClick={() => addReply(comment.id)}>Reply</button>
                        </div>
                    )}
                </React.Fragment>
            ))}

            <div className='newCommentInput'> {/*add comment */}
                <img src={currentUser.image.png} alt={currentUser.username} />
                <textarea rows={4} cols={50} placeholder='Add a comment...' value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)}></textarea>
                <button type='submit' onClick={createNewComment}>SEND</button>
            </div>
        </div>
    );
}

export default CommentSection;
