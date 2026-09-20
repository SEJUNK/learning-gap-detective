from app.models.subject import Concept, Subject

PYTHON_SUBJECT = Subject(
    id="python",
    name="Python",
    concepts=[
        Concept(id="variables", name="Variables", description="Naming and storing values."),
        Concept(
            id="data_types",
            name="Data Types",
            description="int, float, str, bool and how Python represents values.",
            prerequisite_ids=["variables"],
        ),
        Concept(
            id="conditions",
            name="Conditions",
            description="Branching logic with if / elif / else.",
            prerequisite_ids=["data_types"],
        ),
        Concept(
            id="loops",
            name="Loops",
            description="Repeating logic with for and while.",
            prerequisite_ids=["conditions"],
        ),
        Concept(
            id="functions",
            name="Functions",
            description="Packaging reusable logic with def, parameters, and return values.",
            prerequisite_ids=["loops"],
        ),
        Concept(
            id="lists",
            name="Lists",
            description="Ordered, mutable collections of values.",
            prerequisite_ids=["data_types", "loops"],
        ),
        Concept(
            id="dictionaries",
            name="Dictionaries",
            description="Key-value collections for structured lookups.",
            prerequisite_ids=["lists"],
        ),
        Concept(
            id="exceptions",
            name="Exceptions",
            description="Handling runtime errors with try / except.",
            prerequisite_ids=["functions"],
        ),
        Concept(
            id="oop",
            name="Object-Oriented Programming",
            description="Classes, objects, attributes, and methods.",
            prerequisite_ids=["functions", "dictionaries"],
        ),
    ],
)
