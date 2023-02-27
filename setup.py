from setuptools import setup

setup(
    name='consumption',
    version='0.0.1',
    packages=['app'],
    include_package_data=True,
    install_requires=[
        'flask',
        'bootstrap-flask',
        'xlsxwriter',
        'python-dotenv',
        'waitress'
    ],
)
