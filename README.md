# SWE-573 Term Project

## About
This repository has been created for the SWE 573 Term Project

## Tools & Technologies
- **GitHub** (repository hosting, issues, wiki)
- **Wikidata API** (for research tasks)

## Contributors
- Rumeysa Akgün İleri  
- uskudarli (as collaborator)

## Requirements Elicitation
### Functional Requirements
- Should the Service Map allow users to filter posts by tag, location, or type (Offer / Need)? (Yes)
- Should users be able to create, edit, and delete their own service posts?
- Should there be a notification system that alerts users when someone interacts with their post?
- Should users be able to favorite offers or needs they are interested in?
- Should there be any limit on locations to interact with posts?
- Should there be a chat interface showing message history between two users? (Yes, direct messages may be)
- Should the platform allow blocking or reporting of other users for inappropriate behavior?
- Should the system assign each user a TimeBank balance measured in hours? (Yes, also each user should start with some credit for ex 3 hours.)
- Should there be a transaction history showing all TimeBank activities (earned/spent hours)?
- Should users be able to donate or transfer TimeBank hours to others?
- Should each service exchange automatically add hours to one user’s account and subtract the same number of hours from the other’s or there should be a confirmation/approval mechanism?
- Should tags be displayed as filters in the search bar and on the Service Map? (Yes)
- Should there be an Admin Panel for moderators to view and manage community activity? (Yes)
- Should admins be able to remove or hide posts that violate community guidelines?
- Should admins be able to access the posts to track state of offers and services, reports like total exchanges, active users, or top tags?? (Yes)
- Should there be discussion forums separate from the Service Map?
- Should users be able to post, comment, reply, and like forum messages?
- Should users have profiles showing their contributions, tags used, and TimeBank balance (without reputation scores)?
- Should there be community events (like group projects or workshops) that members can join to get extra credit or just join with a credit?
- Should users verify their identity via email or phone while they are signing up?(Yes)
- Should the system send email/notification to suggest nearby offers through past activities of users?
### Non-Functional Requirements
- Should the platform have a responsive front-end design?
- Should the user interface be built with React for dynamic rendering?
- How should be the interface (minimalist, user friendly) ?
- How many concurrent users should platform be able to handle?
- Should the database be indexed by tags and location to support fast queries?
- Should all communication be secured via HTTPS?
- Should user passwords be hashed before storage?
- Should map services integrate with OpenStreetMap or Google Maps API?


