<<<<<<< HEAD
# Consensus Platform

A responsive web platform for collaborative decision-making with role-based access control, AI content moderation, and consensus clustering.

## Features

### Core Functionality
- **Discussion Management**: Create and manage discussions with customizable visibility scopes
- **Role-Based Access Control**: VP, Manager, Employee, and Admin roles with granular permissions
- **AI Content Moderation**: Automatic filtering of toxic content, hate speech, and profanity
- **Consensus Generation**: Automated clustering of similar responses with percentage breakdowns
- **Real-time Updates**: Live participant response tracking
- **Interactive Charts**: Bar and pie charts with role-based filtering

### User Roles & Permissions

#### Vice President (VP)
- Create org-wide discussions
- Invite any users or groups
- Set mandatory deadlines
- View cross-department analytics
- Close discussions and publish consensus

#### Manager
- Create team/department discussions
- Invite users within department
- View team-level analytics
- Close team discussions

#### Employee
- Create private or team discussions
- Invite selected participants
- Respond to discussion invitations
- View results for owned/participated discussions

#### Admin (Optional)
- Manage users, roles, teams, and departments
- Access audit logs
- Configure security policies

### Visibility Scopes
- **Private**: Owner + invited participants only
- **Team**: Team members by default
- **Department**: All department users (requires Manager/VP approval)
- **Org-wide**: Entire organization (VP only)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL (via Supabase)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite

## Database Schema

### Core Tables
- `users` - User accounts with authentication
- `roles` - System roles (ADMIN, VP, MANAGER, EMPLOYEE)
- `user_roles` - User-role assignments
- `departments` - Organizational departments
- `teams` - Teams within departments
- `org_memberships` - User org/team/department memberships

### Discussion Tables
- `discussions` - Discussion topics with scope and settings
- `discussion_approvals` - Approval workflow for scope escalation
- `discussion_participants` - Invited participants
- `responses` - User responses to discussions

### Consensus Tables
- `consensus_results` - Generated consensus summaries
- `response_clusters` - Clustered response groups
- `response_cluster_members` - Response-to-cluster mappings
- `audit_logs` - Complete audit trail

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd consensus-platform
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# .env file is already configured with Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Database setup is complete - migrations have been applied

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Core User Flows

### 1. Create Discussion
1. Navigate to Dashboard
2. Click "New Discussion"
3. Enter title and prompt
4. Select scope (Private/Team/Department/Org)
5. Set optional deadline
6. Configure anonymity and weighted consensus settings
7. Select participants
8. Submit (may require approval based on scope)

### 2. Respond to Discussion
1. View discussion details
2. Read prompt and current status
3. Enter response (subject to AI moderation)
4. Optionally submit anonymously
5. Submit response

### 3. Close Discussion & Generate Consensus
1. Owner/Manager/VP can close discussion
2. System automatically:
   - Clusters similar responses
   - Calculates percentages (weighted if enabled)
   - Generates summary text
   - Creates visual charts

### 4. View Results
1. Navigate to closed discussion
2. View consensus summary
3. Explore charts (bar/pie)
4. Toggle weighted vs unweighted view
5. See cluster breakdown with percentages

## AI Content Moderation

The platform automatically moderates all responses for:
- Toxicity and harassment
- Hate speech and slurs
- Threats and violence
- Profanity (configurable threshold)

Rejected responses receive clear feedback without storage.

## Consensus Algorithm

The clustering algorithm:
1. Tokenizes and preprocesses responses
2. Computes similarity matrix using Jaccard similarity
3. Performs agglomerative clustering
4. Generates cluster labels from common keywords
5. Calculates standard and weighted percentages
6. Creates summary text

### Role Weights (when enabled)
- VP: 1.5x
- Manager: 1.2x
- Employee: 1.0x
- Admin: 1.0x

## Security Features

- Row Level Security (RLS) on all database tables
- Role-based access control for all operations
- Input validation and sanitization
- Audit logging for all critical actions
- Secure password hashing (bcrypt)
- Protected routes and API endpoints

## API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Authenticate user
- `POST /auth/logout` - End session

### Discussions
- `POST /discussions` - Create discussion
- `GET /discussions/:id` - Get discussion details
- `POST /discussions/:id/invite` - Invite participants
- `POST /discussions/:id/responses` - Submit response
- `POST /discussions/:id/close` - Close and generate consensus
- `GET /discussions/:id/results` - Get consensus results

### Admin (Optional)
- `GET /org/teams` - List teams
- `POST /org/teams` - Create team
- `GET /org/users` - List users
- `POST /org/users/:id/roles` - Assign role

## Customization

### Adding New Roles
1. Add role to `role_key` enum in migration
2. Insert role record in `roles` table
3. Update permission checks in backend
4. Add UI role badges/indicators

### Configuring Moderation
- Update `MODERATION_API_KEY` environment variable
- Modify `moderateContent()` function in `services/moderation.ts`
- Adjust profanity list or threshold

### Adjusting Clustering
- Modify similarity threshold in `performClustering()`
- Change role weights in `ROLE_WEIGHTS` constant
- Customize label generation in `generateClusterLabel()`

## Troubleshooting

### Build Errors
```bash
npm run build
```
Check for TypeScript errors and missing dependencies

### Database Connection Issues
Verify `.env` file contains correct Supabase credentials

### Authentication Problems
Ensure RLS policies are properly configured in Supabase

## Future Enhancements

- Real-time WebSocket updates
- CSV/PDF export functionality
- Email notifications
- Multi-language support
- Advanced analytics dashboard
- Comment threads within clusters
- Integration with Slack/Teams

## License

MIT

## Support

For issues and questions, please open a GitHub issue or contact the development team.
=======
# BaselHack Code Repo Template

This is the template repository, which makes our lives (and especially the lives of the jury) easier,
if you follow our structure.

## Explanation

Please make sure that everything, that is code related, goes into `code` directory.

If you have documentation about the code (e.g. UML Diagrams, a readme etc.), that should go into the `documentation` directory.

If you have assets (like videos, presentations etc.), this can go into the `assets` directory.

You can use the MIT license in this template. Make sure to adjust the copy right holders in the placeholder `<copyright holder>` and add every team member to it.
You are also free to choose any other license - depending on the consensus of your team.

Thanks a lot!
>>>>>>> upstream/main
