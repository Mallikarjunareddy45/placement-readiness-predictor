SQL_QUESTIONS = [
    {
        "id": "sql001",
        "question": "What does SQL stand for?",
        "options": ["Structured Query Language", "Simple Query Language", "Standard Query Logic", "Sequential Query Language"],
        "answer": "Structured Query Language",
        "difficulty": "Easy",
        "topic": "Basics"
    },
    {
        "id": "sql002",
        "question": "Which SQL command is used to retrieve data from a table?",
        "options": ["GET", "SELECT", "FETCH", "RETRIEVE"],
        "answer": "SELECT",
        "difficulty": "Easy",
        "topic": "DML"
    },
    {
        "id": "sql003",
        "question": "What is the difference between WHERE and HAVING clause?",
        "options": [
            "WHERE filters rows before grouping; HAVING filters groups after GROUP BY",
            "HAVING filters rows; WHERE filters groups",
            "They are identical",
            "WHERE works only with numbers"
        ],
        "answer": "WHERE filters rows before grouping; HAVING filters groups after GROUP BY",
        "difficulty": "Medium",
        "topic": "Filtering"
    },
    {
        "id": "sql004",
        "question": "What is a PRIMARY KEY?",
        "options": [
            "A column that uniquely identifies each row and cannot be NULL",
            "The first column of a table",
            "A column with the highest values",
            "A foreign key reference"
        ],
        "answer": "A column that uniquely identifies each row and cannot be NULL",
        "difficulty": "Easy",
        "topic": "Constraints"
    },
    {
        "id": "sql005",
        "question": "What does INNER JOIN return?",
        "options": [
            "Only matching rows from both tables",
            "All rows from both tables",
            "All rows from left table",
            "All rows from right table"
        ],
        "answer": "Only matching rows from both tables",
        "difficulty": "Medium",
        "topic": "Joins"
    },
    {
        "id": "sql006",
        "question": "What is the purpose of GROUP BY clause?",
        "options": [
            "Groups rows with same values into summary rows",
            "Sorts rows in groups",
            "Filters duplicate rows",
            "Joins multiple tables"
        ],
        "answer": "Groups rows with same values into summary rows",
        "difficulty": "Medium",
        "topic": "Aggregation"
    },
    {
        "id": "sql007",
        "question": "What is a FOREIGN KEY?",
        "options": [
            "A key that references the PRIMARY KEY of another table",
            "A key from another database",
            "An alternate primary key",
            "A key used for sorting"
        ],
        "answer": "A key that references the PRIMARY KEY of another table",
        "difficulty": "Easy",
        "topic": "Constraints"
    },
    {
        "id": "sql008",
        "question": "What does the DISTINCT keyword do?",
        "options": [
            "Returns only unique values",
            "Sorts results",
            "Counts rows",
            "Filters NULL values"
        ],
        "answer": "Returns only unique values",
        "difficulty": "Easy",
        "topic": "DML"
    },
    {
        "id": "sql009",
        "question": "What is a subquery?",
        "options": [
            "A query nested inside another query",
            "A simplified query",
            "A query on a subset of data",
            "A stored procedure"
        ],
        "answer": "A query nested inside another query",
        "difficulty": "Medium",
        "topic": "Advanced Queries"
    },
    {
        "id": "sql010",
        "question": "What is the difference between DELETE and TRUNCATE?",
        "options": [
            "DELETE removes specific rows and can be rolled back; TRUNCATE removes all rows and cannot be rolled back",
            "TRUNCATE removes specific rows; DELETE removes all rows",
            "They are identical",
            "DELETE is faster than TRUNCATE"
        ],
        "answer": "DELETE removes specific rows and can be rolled back; TRUNCATE removes all rows and cannot be rolled back",
        "difficulty": "Medium",
        "topic": "DML"
    },
    {
        "id": "sql011",
        "question": "What is a VIEW in SQL?",
        "options": [
            "A virtual table based on the result of a SQL query",
            "A physical copy of a table",
            "A backup of a database",
            "A stored procedure"
        ],
        "answer": "A virtual table based on the result of a SQL query",
        "difficulty": "Medium",
        "topic": "Views"
    },
    {
        "id": "sql012",
        "question": "What is an INDEX in SQL?",
        "options": [
            "A data structure that improves query performance by allowing faster data retrieval",
            "A row identifier",
            "A column constraint",
            "A type of join"
        ],
        "answer": "A data structure that improves query performance by allowing faster data retrieval",
        "difficulty": "Medium",
        "topic": "Optimization"
    },
    {
        "id": "sql013",
        "question": "What is a stored procedure?",
        "options": [
            "A precompiled set of SQL statements stored in the database",
            "A temporary table",
            "A type of index",
            "A view with parameters"
        ],
        "answer": "A precompiled set of SQL statements stored in the database",
        "difficulty": "Medium",
        "topic": "Stored Procedures"
    },
    {
        "id": "sql014",
        "question": "What is the difference between UNION and UNION ALL?",
        "options": [
            "UNION removes duplicates; UNION ALL keeps all rows including duplicates",
            "UNION ALL removes duplicates; UNION keeps all",
            "They are identical",
            "UNION is faster"
        ],
        "answer": "UNION removes duplicates; UNION ALL keeps all rows including duplicates",
        "difficulty": "Medium",
        "topic": "Set Operations"
    },
    {
        "id": "sql015",
        "question": "What is normalization in databases?",
        "options": [
            "The process of organizing data to reduce redundancy and improve data integrity",
            "Converting data to uppercase",
            "Sorting table rows",
            "Creating indexes"
        ],
        "answer": "The process of organizing data to reduce redundancy and improve data integrity",
        "difficulty": "Medium",
        "topic": "Database Design"
    },
    {
        "id": "sql016",
        "question": "What does the COALESCE function do?",
        "options": [
            "Returns the first non-NULL value from a list of arguments",
            "Combines two strings",
            "Converts data types",
            "Counts NULL values"
        ],
        "answer": "Returns the first non-NULL value from a list of arguments",
        "difficulty": "Hard",
        "topic": "Functions"
    },
    {
        "id": "sql017",
        "question": "What is a CTE (Common Table Expression)?",
        "options": [
            "A temporary named result set defined within a WITH clause",
            "A type of index",
            "A stored function",
            "A database trigger"
        ],
        "answer": "A temporary named result set defined within a WITH clause",
        "difficulty": "Hard",
        "topic": "Advanced Queries"
    },
    {
        "id": "sql018",
        "question": "What is a window function in SQL?",
        "options": [
            "A function that performs calculations across a set of rows related to the current row",
            "A function that opens a database connection",
            "A GUI function",
            "A function that filters rows"
        ],
        "answer": "A function that performs calculations across a set of rows related to the current row",
        "difficulty": "Hard",
        "topic": "Window Functions"
    },
    {
        "id": "sql019",
        "question": "What is the difference between RANK() and DENSE_RANK()?",
        "options": [
            "RANK() skips numbers after ties; DENSE_RANK() does not skip numbers",
            "DENSE_RANK() skips numbers; RANK() doesn't",
            "They are identical",
            "RANK() only works with integers"
        ],
        "answer": "RANK() skips numbers after ties; DENSE_RANK() does not skip numbers",
        "difficulty": "Hard",
        "topic": "Window Functions"
    },
    {
        "id": "sql020",
        "question": "What is ACID in database transactions?",
        "options": [
            "Atomicity, Consistency, Isolation, Durability",
            "Accuracy, Completeness, Integrity, Data",
            "Access, Control, Index, Data",
            "Availability, Consistency, Isolation, Durability"
        ],
        "answer": "Atomicity, Consistency, Isolation, Durability",
        "difficulty": "Medium",
        "topic": "Transactions"
    },
    {
        "id": "sql021",
        "question": "What is a LEFT JOIN?",
        "options": [
            "Returns all rows from left table and matching rows from right table",
            "Returns only matching rows from both tables",
            "Returns all rows from right table",
            "Returns all rows from both tables"
        ],
        "answer": "Returns all rows from left table and matching rows from right table",
        "difficulty": "Medium",
        "topic": "Joins"
    },
    {
        "id": "sql022",
        "question": "What does NULL represent in SQL?",
        "options": [
            "An unknown or missing value",
            "Zero",
            "An empty string",
            "False"
        ],
        "answer": "An unknown or missing value",
        "difficulty": "Easy",
        "topic": "Basics"
    },
    {
        "id": "sql023",
        "question": "What is the ORDER BY clause used for?",
        "options": [
            "Sorts query results in ascending or descending order",
            "Groups rows",
            "Filters rows",
            "Joins tables"
        ],
        "answer": "Sorts query results in ascending or descending order",
        "difficulty": "Easy",
        "topic": "DML"
    },
    {
        "id": "sql024",
        "question": "What is a trigger in SQL?",
        "options": [
            "A procedure that automatically executes in response to database events",
            "A type of index",
            "A constraint",
            "A join type"
        ],
        "answer": "A procedure that automatically executes in response to database events",
        "difficulty": "Hard",
        "topic": "Triggers"
    },
    {
        "id": "sql025",
        "question": "What is denormalization?",
        "options": [
            "Adding redundancy to a database to improve read performance",
            "Removing all indexes",
            "Deleting duplicate rows",
            "Converting to a flat file"
        ],
        "answer": "Adding redundancy to a database to improve read performance",
        "difficulty": "Hard",
        "topic": "Database Design"
    },
    {
        "id": "sql026",
        "question": "Which aggregate function counts all rows including NULLs?",
        "options": ["COUNT(*)", "COUNT(column)", "SUM(*)", "TOTAL(*)"],
        "answer": "COUNT(*)",
        "difficulty": "Easy",
        "topic": "Aggregation"
    },
    {
        "id": "sql027",
        "question": "What is a SELF JOIN?",
        "options": [
            "Joining a table with itself",
            "Joining two identical databases",
            "A join with no condition",
            "A join using primary keys only"
        ],
        "answer": "Joining a table with itself",
        "difficulty": "Hard",
        "topic": "Joins"
    },
    {
        "id": "sql028",
        "question": "What does ROLLBACK do in SQL?",
        "options": [
            "Undoes all changes made in the current transaction",
            "Saves the current transaction",
            "Deletes all records",
            "Restores a backup"
        ],
        "answer": "Undoes all changes made in the current transaction",
        "difficulty": "Medium",
        "topic": "Transactions"
    },
    {
        "id": "sql029",
        "question": "What is the difference between CHAR and VARCHAR?",
        "options": [
            "CHAR is fixed length; VARCHAR is variable length",
            "VARCHAR is fixed; CHAR is variable",
            "They are identical in modern databases",
            "CHAR stores only numbers"
        ],
        "answer": "CHAR is fixed length; VARCHAR is variable length",
        "difficulty": "Easy",
        "topic": "Data Types"
    },
    {
        "id": "sql030",
        "question": "What is an execution plan in SQL?",
        "options": [
            "A roadmap the database engine uses to execute a query optimally",
            "A scheduled job",
            "A stored procedure",
            "A database backup plan"
        ],
        "answer": "A roadmap the database engine uses to execute a query optimally",
        "difficulty": "Hard",
        "topic": "Optimization"
    },
    {
        "id": "sql031",
        "question": "What does the LIKE operator do in SQL?",
        "options": [
            "Searches for a pattern in a column",
            "Compares two values for equality",
            "Checks if a value is in a list",
            "Joins two tables"
        ],
        "answer": "Searches for a pattern in a column",
        "difficulty": "Easy",
        "topic": "Filtering"
    },
    {
        "id": "sql032",
        "question": "What is a composite key?",
        "options": [
            "A primary key made up of two or more columns",
            "A key that references multiple tables",
            "A key with composite data type",
            "A key used in composite joins"
        ],
        "answer": "A primary key made up of two or more columns",
        "difficulty": "Medium",
        "topic": "Constraints"
    },
    {
        "id": "sql033",
        "question": "What does EXPLAIN do in SQL?",
        "options": [
            "Shows the execution plan for a query",
            "Adds comments to a query",
            "Documents a stored procedure",
            "Lists all tables"
        ],
        "answer": "Shows the execution plan for a query",
        "difficulty": "Hard",
        "topic": "Optimization"
    },
    {
        "id": "sql034",
        "question": "What is the IN operator used for?",
        "options": [
            "Checks if a value matches any value in a list",
            "Checks if a value is in a range",
            "Joins tables",
            "Filters NULL values"
        ],
        "answer": "Checks if a value matches any value in a list",
        "difficulty": "Easy",
        "topic": "Filtering"
    },
    {
        "id": "sql035",
        "question": "What is the difference between a clustered and non-clustered index?",
        "options": [
            "Clustered index sorts and stores data rows physically; non-clustered creates a separate structure",
            "Non-clustered is faster for all queries",
            "They are identical in functionality",
            "Clustered indexes cannot be on primary keys"
        ],
        "answer": "Clustered index sorts and stores data rows physically; non-clustered creates a separate structure",
        "difficulty": "Hard",
        "topic": "Indexes"
    },
    {
        "id": "sql036",
        "question": "What is the MAX() function used for?",
        "options": [
            "Returns the highest value in a column",
            "Returns the last row",
            "Returns the most frequent value",
            "Returns all values above average"
        ],
        "answer": "Returns the highest value in a column",
        "difficulty": "Easy",
        "topic": "Aggregation"
    },
    {
        "id": "sql037",
        "question": "What is a CROSS JOIN?",
        "options": [
            "Returns the Cartesian product of two tables",
            "Joins tables on crossing columns",
            "A join with multiple conditions",
            "A join that removes duplicates"
        ],
        "answer": "Returns the Cartesian product of two tables",
        "difficulty": "Medium",
        "topic": "Joins"
    },
    {
        "id": "sql038",
        "question": "What does the BETWEEN operator do?",
        "options": [
            "Selects values within a given range (inclusive)",
            "Selects values between two tables",
            "Joins rows between two dates only",
            "Returns values excluding the endpoints"
        ],
        "answer": "Selects values within a given range (inclusive)",
        "difficulty": "Easy",
        "topic": "Filtering"
    },
    {
        "id": "sql039",
        "question": "What is a database schema?",
        "options": [
            "The structure that defines the organization of data in a database",
            "A backup of the database",
            "A type of query",
            "A database user account"
        ],
        "answer": "The structure that defines the organization of data in a database",
        "difficulty": "Easy",
        "topic": "Database Design"
    },
    {
        "id": "sql040",
        "question": "What is the ROW_NUMBER() function?",
        "options": [
            "Assigns a unique sequential number to each row within a partition",
            "Returns the total count of rows",
            "Returns the row index from disk",
            "Generates a random row identifier"
        ],
        "answer": "Assigns a unique sequential number to each row within a partition",
        "difficulty": "Hard",
        "topic": "Window Functions"
    },
    {
        "id": "sql041",
        "question": "What is the difference between DROP and DELETE in SQL?",
        "options": [
            "DROP removes the entire table structure; DELETE removes rows only",
            "DELETE removes the table; DROP removes rows",
            "They are identical",
            "DROP can be rolled back; DELETE cannot"
        ],
        "answer": "DROP removes the entire table structure; DELETE removes rows only",
        "difficulty": "Medium",
        "topic": "DDL vs DML"
    },
    {
        "id": "sql042",
        "question": "What does COMMIT do in SQL?",
        "options": [
            "Saves all changes made in the current transaction permanently",
            "Undoes all changes",
            "Creates a savepoint",
            "Locks a table"
        ],
        "answer": "Saves all changes made in the current transaction permanently",
        "difficulty": "Medium",
        "topic": "Transactions"
    },
    {
        "id": "sql043",
        "question": "What is a materialized view?",
        "options": [
            "A view that stores query results physically on disk for faster access",
            "A view with animations",
            "A temporary view",
            "A view with security restrictions"
        ],
        "answer": "A view that stores query results physically on disk for faster access",
        "difficulty": "Hard",
        "topic": "Views"
    },
    {
        "id": "sql044",
        "question": "What does AVG() function return?",
        "options": [
            "The average value of a numeric column",
            "The most common value",
            "The middle value",
            "The sum divided by count including NULLs"
        ],
        "answer": "The average value of a numeric column",
        "difficulty": "Easy",
        "topic": "Aggregation"
    },
    {
        "id": "sql045",
        "question": "What is a deadlock in databases?",
        "options": [
            "When two transactions wait indefinitely for each other to release locks",
            "When a query takes too long",
            "When a table is corrupted",
            "When a connection times out"
        ],
        "answer": "When two transactions wait indefinitely for each other to release locks",
        "difficulty": "Hard",
        "topic": "Concurrency"
    },
    {
        "id": "sql046",
        "question": "Which SQL clause is used to rename a column in the result?",
        "options": ["AS", "RENAME", "ALIAS", "NAME"],
        "answer": "AS",
        "difficulty": "Easy",
        "topic": "DML"
    },
    {
        "id": "sql047",
        "question": "What is the PARTITION BY clause used for?",
        "options": [
            "Divides result set into partitions for window functions",
            "Splits a table into multiple tables",
            "Creates table partitions for storage",
            "Groups rows like GROUP BY"
        ],
        "answer": "Divides result set into partitions for window functions",
        "difficulty": "Hard",
        "topic": "Window Functions"
    },
    {
        "id": "sql048",
        "question": "What is referential integrity?",
        "options": [
            "Ensures foreign key values always reference valid primary key values",
            "Ensures all values are unique",
            "Ensures no NULL values exist",
            "Ensures data is encrypted"
        ],
        "answer": "Ensures foreign key values always reference valid primary key values",
        "difficulty": "Medium",
        "topic": "Constraints"
    },
    {
        "id": "sql049",
        "question": "What does the ISNULL() or IS NULL check for?",
        "options": [
            "Checks if a value is NULL",
            "Checks if a string is empty",
            "Checks if a column exists",
            "Checks if a value is zero"
        ],
        "answer": "Checks if a value is NULL",
        "difficulty": "Easy",
        "topic": "Filtering"
    },
    {
        "id": "sql050",
        "question": "What is sharding in databases?",
        "options": [
            "Horizontally partitioning data across multiple database instances",
            "Splitting a table vertically",
            "Creating database backups",
            "Compressing database files"
        ],
        "answer": "Horizontally partitioning data across multiple database instances",
        "difficulty": "Hard",
        "topic": "Scalability"
    },
]