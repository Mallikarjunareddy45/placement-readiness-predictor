PYTHON_QUESTIONS = [
    {
        "id": "py001",
        "question": "What is the output of: print(type([]))?",
        "options": ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"],
        "answer": "<class 'list'>",
        "difficulty": "Easy",
        "topic": "Data Types"
    },
    {
        "id": "py002",
        "question": "Which of the following is used to define a function in Python?",
        "options": ["func", "def", "function", "define"],
        "answer": "def",
        "difficulty": "Easy",
        "topic": "Functions"
    },
    {
        "id": "py003",
        "question": "What does the 'self' keyword represent in a Python class?",
        "options": ["The class itself", "The current instance of the class", "A static method", "A global variable"],
        "answer": "The current instance of the class",
        "difficulty": "Easy",
        "topic": "OOP"
    },
    {
        "id": "py004",
        "question": "What is the output of: print(2 ** 3)?",
        "options": ["6", "8", "9", "5"],
        "answer": "8",
        "difficulty": "Easy",
        "topic": "Operators"
    },
    {
        "id": "py005",
        "question": "Which data structure in Python is immutable?",
        "options": ["List", "Dictionary", "Tuple", "Set"],
        "answer": "Tuple",
        "difficulty": "Easy",
        "topic": "Data Types"
    },
    {
        "id": "py006",
        "question": "What is the correct way to create a dictionary in Python?",
        "options": ["d = {}", "d = []", "d = ()", "d = <>"],
        "answer": "d = {}",
        "difficulty": "Easy",
        "topic": "Data Types"
    },
    {
        "id": "py007",
        "question": "What does 'len()' function return?",
        "options": ["Length of object", "Last element", "Memory size", "Data type"],
        "answer": "Length of object",
        "difficulty": "Easy",
        "topic": "Built-in Functions"
    },
    {
        "id": "py008",
        "question": "Which keyword is used to handle exceptions in Python?",
        "options": ["catch", "except", "error", "handle"],
        "answer": "except",
        "difficulty": "Easy",
        "topic": "Exception Handling"
    },
    {
        "id": "py009",
        "question": "What is a lambda function in Python?",
        "options": ["A named function", "An anonymous single-expression function", "A recursive function", "A class method"],
        "answer": "An anonymous single-expression function",
        "difficulty": "Medium",
        "topic": "Functions"
    },
    {
        "id": "py010",
        "question": "What is the output of: list(range(1, 10, 2))?",
        "options": ["[1,3,5,7,9]", "[1,2,3,4,5]", "[2,4,6,8]", "[1,3,5,7]"],
        "answer": "[1,3,5,7,9]",
        "difficulty": "Medium",
        "topic": "Built-in Functions"
    },
    {
        "id": "py011",
        "question": "What is a decorator in Python?",
        "options": [
            "A function that modifies another function",
            "A loop construct",
            "A data structure",
            "A file operation"
        ],
        "answer": "A function that modifies another function",
        "difficulty": "Medium",
        "topic": "Advanced Functions"
    },
    {
        "id": "py012",
        "question": "What is the difference between 'deepcopy' and 'copy' in Python?",
        "options": [
            "deepcopy copies nested objects recursively; copy only copies the top level",
            "copy copies nested objects; deepcopy doesn't",
            "They are identical",
            "deepcopy is faster"
        ],
        "answer": "deepcopy copies nested objects recursively; copy only copies the top level",
        "difficulty": "Medium",
        "topic": "Memory Management"
    },
    {
        "id": "py013",
        "question": "What does the 'yield' keyword do in Python?",
        "options": [
            "Returns a value and pauses the function, making it a generator",
            "Terminates the function",
            "Skips the current iteration",
            "Imports a module"
        ],
        "answer": "Returns a value and pauses the function, making it a generator",
        "difficulty": "Medium",
        "topic": "Generators"
    },
    {
        "id": "py014",
        "question": "What is the output of: print([x**2 for x in range(5)])?",
        "options": ["[0,1,4,9,16]", "[1,4,9,16,25]", "[0,1,2,3,4]", "[1,2,3,4,5]"],
        "answer": "[0,1,4,9,16]",
        "difficulty": "Medium",
        "topic": "List Comprehension"
    },
    {
        "id": "py015",
        "question": "Which module is used for regular expressions in Python?",
        "options": ["regex", "re", "regexp", "pattern"],
        "answer": "re",
        "difficulty": "Medium",
        "topic": "Modules"
    },
    {
        "id": "py016",
        "question": "What is the Global Interpreter Lock (GIL) in Python?",
        "options": [
            "A mutex that protects access to Python objects, preventing multiple threads from executing simultaneously",
            "A garbage collection mechanism",
            "A memory allocation strategy",
            "A security feature for file access"
        ],
        "answer": "A mutex that protects access to Python objects, preventing multiple threads from executing simultaneously",
        "difficulty": "Hard",
        "topic": "Concurrency"
    },
    {
        "id": "py017",
        "question": "What is the time complexity of accessing an element in a Python dictionary?",
        "options": ["O(n)", "O(log n)", "O(1) average", "O(n²)"],
        "answer": "O(1) average",
        "difficulty": "Hard",
        "topic": "Data Structures"
    },
    {
        "id": "py018",
        "question": "What is metaclass in Python?",
        "options": [
            "A class whose instances are classes",
            "A parent class",
            "An abstract class",
            "A hidden class"
        ],
        "answer": "A class whose instances are classes",
        "difficulty": "Hard",
        "topic": "Advanced OOP"
    },
    {
        "id": "py019",
        "question": "What does __slots__ do in a Python class?",
        "options": [
            "Restricts instance attributes to a fixed set, saving memory",
            "Adds dynamic attributes",
            "Creates class methods",
            "Defines abstract methods"
        ],
        "answer": "Restricts instance attributes to a fixed set, saving memory",
        "difficulty": "Hard",
        "topic": "Memory Management"
    },
    {
        "id": "py020",
        "question": "What is the difference between __str__ and __repr__ in Python?",
        "options": [
            "__str__ is for readable output for end users; __repr__ is for unambiguous representation for developers",
            "__repr__ is for users; __str__ is for developers",
            "They are identical",
            "__str__ is faster"
        ],
        "answer": "__str__ is for readable output for end users; __repr__ is for unambiguous representation for developers",
        "difficulty": "Hard",
        "topic": "Magic Methods"
    },
    {
        "id": "py021",
        "question": "How do you open a file for reading in Python?",
        "options": ["open('file', 'r')", "open('file', 'w')", "open('file', 'x')", "open('file', 'a')"],
        "answer": "open('file', 'r')",
        "difficulty": "Easy",
        "topic": "File Handling"
    },
    {
        "id": "py022",
        "question": "What is PEP 8?",
        "options": [
            "Python's style guide for writing readable code",
            "A Python package manager",
            "A testing framework",
            "A database ORM"
        ],
        "answer": "Python's style guide for writing readable code",
        "difficulty": "Easy",
        "topic": "Best Practices"
    },
    {
        "id": "py023",
        "question": "Which of the following is NOT a valid Python data type?",
        "options": ["int", "float", "char", "bool"],
        "answer": "char",
        "difficulty": "Easy",
        "topic": "Data Types"
    },
    {
        "id": "py024",
        "question": "What is the output of: bool('') in Python?",
        "options": ["True", "False", "None", "Error"],
        "answer": "False",
        "difficulty": "Medium",
        "topic": "Data Types"
    },
    {
        "id": "py025",
        "question": "What does *args do in a function definition?",
        "options": [
            "Allows passing variable number of positional arguments",
            "Allows passing variable number of keyword arguments",
            "Makes all arguments optional",
            "Creates a tuple argument"
        ],
        "answer": "Allows passing variable number of positional arguments",
        "difficulty": "Medium",
        "topic": "Functions"
    },
    {
        "id": "py026",
        "question": "What is the purpose of __init__ method in Python?",
        "options": [
            "To initialize object attributes when an instance is created",
            "To destroy an object",
            "To copy an object",
            "To print an object"
        ],
        "answer": "To initialize object attributes when an instance is created",
        "difficulty": "Easy",
        "topic": "OOP"
    },
    {
        "id": "py027",
        "question": "What is the output of: 'Hello'[::-1]?",
        "options": ["olleH", "Hello", "HHeelllloo", "Error"],
        "answer": "olleH",
        "difficulty": "Medium",
        "topic": "String Operations"
    },
    {
        "id": "py028",
        "question": "Which of these is a mutable data type in Python?",
        "options": ["str", "tuple", "int", "list"],
        "answer": "list",
        "difficulty": "Easy",
        "topic": "Data Types"
    },
    {
        "id": "py029",
        "question": "What is monkey patching in Python?",
        "options": [
            "Dynamically modifying a class or module at runtime",
            "A debugging technique",
            "A testing framework",
            "A type of inheritance"
        ],
        "answer": "Dynamically modifying a class or module at runtime",
        "difficulty": "Hard",
        "topic": "Advanced Python"
    },
    {
        "id": "py030",
        "question": "What does the 'with' statement do in Python?",
        "options": [
            "Manages resources automatically using context managers",
            "Creates a loop",
            "Defines a block",
            "Imports a module"
        ],
        "answer": "Manages resources automatically using context managers",
        "difficulty": "Medium",
        "topic": "Context Managers"
    },
    # 20 more questions
    {
        "id": "py031",
        "question": "What is the difference between 'is' and '==' in Python?",
        "options": [
            "'is' checks identity (same object in memory); '==' checks equality of values",
            "'==' checks identity; 'is' checks values",
            "They are identical",
            "'is' is faster"
        ],
        "answer": "'is' checks identity (same object in memory); '==' checks equality of values",
        "difficulty": "Medium",
        "topic": "Operators"
    },
    {
        "id": "py032",
        "question": "What is a Python virtual environment?",
        "options": [
            "An isolated Python environment with its own packages",
            "A cloud Python server",
            "A Python IDE",
            "A version control tool"
        ],
        "answer": "An isolated Python environment with its own packages",
        "difficulty": "Easy",
        "topic": "Environment"
    },
    {
        "id": "py033",
        "question": "What does map() function do in Python?",
        "options": [
            "Applies a function to every item in an iterable",
            "Creates a dictionary from two lists",
            "Filters elements from a list",
            "Sorts a list"
        ],
        "answer": "Applies a function to every item in an iterable",
        "difficulty": "Medium",
        "topic": "Functional Programming"
    },
    {
        "id": "py034",
        "question": "What is the output of: sorted([3,1,4,1,5], reverse=True)?",
        "options": ["[5,4,3,1,1]", "[1,1,3,4,5]", "[3,1,4,1,5]", "Error"],
        "answer": "[5,4,3,1,1]",
        "difficulty": "Easy",
        "topic": "Built-in Functions"
    },
    {
        "id": "py035",
        "question": "What is a Python iterator?",
        "options": [
            "An object that implements __iter__ and __next__ methods",
            "A loop variable",
            "A list index",
            "A generator function"
        ],
        "answer": "An object that implements __iter__ and __next__ methods",
        "difficulty": "Medium",
        "topic": "Iterators"
    },
    {
        "id": "py036",
        "question": "What does the @property decorator do?",
        "options": [
            "Allows a method to be accessed like an attribute",
            "Makes a method private",
            "Creates a class variable",
            "Defines a static method"
        ],
        "answer": "Allows a method to be accessed like an attribute",
        "difficulty": "Medium",
        "topic": "OOP"
    },
    {
        "id": "py037",
        "question": "What is the purpose of __name__ == '__main__' in Python?",
        "options": [
            "Ensures code runs only when the script is executed directly, not imported",
            "Defines the main function",
            "Sets the module name",
            "Checks Python version"
        ],
        "answer": "Ensures code runs only when the script is executed directly, not imported",
        "difficulty": "Medium",
        "topic": "Modules"
    },
    {
        "id": "py038",
        "question": "What is pickling in Python?",
        "options": [
            "Serializing a Python object to a byte stream",
            "Compressing a file",
            "Encrypting data",
            "Copying a dictionary"
        ],
        "answer": "Serializing a Python object to a byte stream",
        "difficulty": "Medium",
        "topic": "Serialization"
    },
    {
        "id": "py039",
        "question": "What is the output of: set([1,2,2,3,3,3])?",
        "options": ["{1,2,3}", "[1,2,3]", "(1,2,3)", "{1,2,2,3,3,3}"],
        "answer": "{1,2,3}",
        "difficulty": "Easy",
        "topic": "Data Types"
    },
    {
        "id": "py040",
        "question": "What does filter() function do in Python?",
        "options": [
            "Returns elements from an iterable where a function returns True",
            "Applies a function to all elements",
            "Sorts elements",
            "Removes duplicates"
        ],
        "answer": "Returns elements from an iterable where a function returns True",
        "difficulty": "Medium",
        "topic": "Functional Programming"
    },
    {
        "id": "py041",
        "question": "What is method resolution order (MRO) in Python?",
        "options": [
            "The order in which Python searches for methods in inheritance hierarchies",
            "The order of method execution",
            "A sorting algorithm",
            "A memory management technique"
        ],
        "answer": "The order in which Python searches for methods in inheritance hierarchies",
        "difficulty": "Hard",
        "topic": "OOP"
    },
    {
        "id": "py042",
        "question": "Which Python module is used for JSON handling?",
        "options": ["json", "pickle", "csv", "xml"],
        "answer": "json",
        "difficulty": "Easy",
        "topic": "Modules"
    },
    {
        "id": "py043",
        "question": "What is the output of: 10 // 3 in Python?",
        "options": ["3.33", "3", "4", "3.0"],
        "answer": "3",
        "difficulty": "Easy",
        "topic": "Operators"
    },
    {
        "id": "py044",
        "question": "What is a coroutine in Python?",
        "options": [
            "A function that can suspend and resume execution using async/await",
            "A type of thread",
            "A recursive function",
            "A class method"
        ],
        "answer": "A function that can suspend and resume execution using async/await",
        "difficulty": "Hard",
        "topic": "Async Programming"
    },
    {
        "id": "py045",
        "question": "What does enumerate() do in Python?",
        "options": [
            "Returns an enumerate object with index and value pairs",
            "Counts elements in a list",
            "Creates a numbered list",
            "Sorts with indices"
        ],
        "answer": "Returns an enumerate object with index and value pairs",
        "difficulty": "Easy",
        "topic": "Built-in Functions"
    },
    {
        "id": "py046",
        "question": "What is the difference between list and tuple performance?",
        "options": [
            "Tuples are faster to iterate and have less memory overhead since they're immutable",
            "Lists are faster in all cases",
            "They have identical performance",
            "Tuples are slower"
        ],
        "answer": "Tuples are faster to iterate and have less memory overhead since they're immutable",
        "difficulty": "Hard",
        "topic": "Performance"
    },
    {
        "id": "py047",
        "question": "What does zip() function do in Python?",
        "options": [
            "Combines multiple iterables element-wise into tuples",
            "Compresses a file",
            "Merges two dictionaries",
            "Concatenates strings"
        ],
        "answer": "Combines multiple iterables element-wise into tuples",
        "difficulty": "Medium",
        "topic": "Built-in Functions"
    },
    {
        "id": "py048",
        "question": "What is a namespace in Python?",
        "options": [
            "A mapping from names to objects",
            "A module import system",
            "A memory region",
            "A class definition"
        ],
        "answer": "A mapping from names to objects",
        "difficulty": "Medium",
        "topic": "Advanced Python"
    },
    {
        "id": "py049",
        "question": "What is the purpose of super() in Python?",
        "options": [
            "Calls a method from the parent class",
            "Creates a superclass",
            "Overrides a method",
            "Deletes an attribute"
        ],
        "answer": "Calls a method from the parent class",
        "difficulty": "Medium",
        "topic": "OOP"
    },
    {
        "id": "py050",
        "question": "What is the time complexity of appending to a Python list?",
        "options": ["O(1) amortized", "O(n)", "O(log n)", "O(n²)"],
        "answer": "O(1) amortized",
        "difficulty": "Hard",
        "topic": "Performance"
    },
]