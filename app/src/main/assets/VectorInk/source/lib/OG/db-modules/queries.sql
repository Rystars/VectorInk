

#USER SUGGESTIONS
SELECT a.user_id, a.user_name, a.email, a.first_name, a.last_name, a.created_at
FROM user a
LEFT JOIN (
	SELECT user_b_id
	FROM user_assoc
	WHERE user_a_id = 'bwe68mclc-1584413101997'
) b ON b.user_b_id = a.user_id
WHERE a.user_id != 'bwe68mclc-1584413101997' AND b.user_b_id IS NULL

#USER: FOLLOWING
SELECT a.user_id, a.user_name, a.email, a.first_name, a.last_name, a.created_at
FROM user a
JOIN user_assoc b ON b.user_b_id = a.user_id
WHERE b.user_a_id = '8jqi8r2l2-1584411621965'

#USER: FOLLOWERS
SELECT a.user_id, a.user_name, a.email, a.first_name, a.last_name, a.created_at
FROM user a
JOIN user_assoc b ON b.user_a_id = a.user_id
WHERE b.user_b_id = '3w8x23wc1-1584414240960'

#USER MESSAGES
SELECT a.message, b.name
FROM post a
JOIN user b ON b.user_id = a.author_id
JOIN record_group c ON c.record_group_id = a.record_group_id AND c.owner_id = a.author_id
JOIN record_group_user d ON d.group_id = c.record_group_id
WHERE d.user_id = 'pw1i0gfnq-1584854349234'

