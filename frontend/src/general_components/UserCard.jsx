import { Card, CardContent, Avatar, Typography, Box } from '@mui/material';
import { gravatarUrl } from '../utils/gravatar';

const UserCard = ({ user, onClick, selected = false }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      border: selected ? 2 : 1,
      borderColor: selected ? 'primary.main' : 'divider',
      transition: 'box-shadow 0.2s',
      '&:hover': onClick ? { boxShadow: 3 } : {},
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar src={gravatarUrl(user.gravatar_hash, { size: 72 })} alt={user.username} sx={{ width: 36, height: 36 }}>
          {user.username?.[0]?.toUpperCase()}
        </Avatar>
        <Typography variant="body1" fontWeight={500} noWrap>
          {user.username}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export default UserCard;
